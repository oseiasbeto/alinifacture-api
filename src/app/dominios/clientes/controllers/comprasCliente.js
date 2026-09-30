const mongoose = require('mongoose');
const Pedido = require('../../../models/Pedido'); // ajuste o caminho

// ───────────────────────── Configuração ─────────────────────────
const TZ = 'Africa/Luanda';
const OFFSET_H = 1;                                  // Luanda = UTC+1 (sem horário de verão)
const CAMPO_DATA = 'createdAt';                      // campo de data do pedido
const ESTADOS_EXCLUIDOS = ['cancelado', 'cancelada']; // pedidos que NÃO contam como compra
const { ObjectId } = mongoose.Types;

// valor do pedido = quantidade × preço unitário + valor adicional do serviço
const VALOR_PEDIDO = {
  $add: [
    { $multiply: [{ $ifNull: ['$quantidade', 1] }, { $ifNull: ['$precoUnitario', 0] }] },
    { $ifNull: ['$valorAdicionalServico', 0] },
  ],
};

// ───────────────────────── Helpers de datas ─────────────────────────
const MS_H = 3600000;
const MS_DIA = 86400000;

const hojeLuanda = () => new Date(Date.now() + OFFSET_H * MS_H).toISOString().slice(0, 10);

// Devolve { inicio, fim } (fim exclusivo) em UTC, para o período que contém "referencia"
function intervalo(periodo, referencia) {
  if (periodo === 'todos') return null;
  const [a, m, d] = (referencia || hojeLuanda()).split('-').map(Number);
  let ini, fim;

  if (periodo === 'ano') {
    ini = Date.UTC(a, 0, 1);
    fim = Date.UTC(a + 1, 0, 1);
  } else if (periodo === 'mes') {
    ini = Date.UTC(a, m - 1, 1);
    fim = Date.UTC(a, m, 1);
  } else {
    // semana: segunda → domingo
    const dow = (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
    ini = Date.UTC(a, m - 1, d - dow);
    fim = ini + 7 * MS_DIA;
  }
  const off = OFFSET_H * MS_H;
  return { inicio: new Date(ini - off), fim: new Date(fim - off) };
}

// Referência do período imediatamente anterior (para comparação)
function referenciaAnterior(periodo, referencia) {
  const [a, m, d] = (referencia || hojeLuanda()).split('-').map(Number);
  const dt =
    periodo === 'ano' ? new Date(Date.UTC(a - 1, 0, 1))
    : periodo === 'mes' ? new Date(Date.UTC(a, m - 2, 1))
    : new Date(Date.UTC(a, m - 1, d - 7));
  return dt.toISOString().slice(0, 10);
}

// Preenche dias/meses sem compras com zero (gráfico sem "buracos")
function preencherSerie(periodo, rango, serie) {
  const mapa = new Map(serie.map((s) => [s._id, s]));
  if (!rango) {
    return serie.map((s) => ({ chave: s._id, pedidos: s.pedidos, valor: s.valor }));
  }
  const off = OFFSET_H * MS_H;
  const out = [];
  let cur = new Date(rango.inicio.getTime() + off);
  const end = new Date(rango.fim.getTime() + off);

  while (cur < end) {
    const mensal = periodo === 'ano';
    const chave = cur.toISOString().slice(0, mensal ? 7 : 10);
    const s = mapa.get(chave);
    out.push({ chave, pedidos: s?.pedidos || 0, valor: s?.valor || 0 });
    cur = mensal
      ? new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1))
      : new Date(cur.getTime() + MS_DIA);
  }
  return out;
}

const filtroBase = (clienteFiltro, rango) => {
  const match = { cliente: clienteFiltro, estado: { $nin: ESTADOS_EXCLUIDOS } };
  if (rango) match[CAMPO_DATA] = { $gte: rango.inicio, $lt: rango.fim };
  return match;
};

// ───────────────────────── GET /clientes/compras/totais?ids=a,b,c ─────────────────────────
// Usado na tabela de clientes (uma única consulta para a página inteira)
const totaisCompras = async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .filter((id) => ObjectId.isValid(id))
      .slice(0, 100)
      .map((id) => new ObjectId(id));

    if (!ids.length) return res.json({ success: true, totais: {} });

    const linhas = await Pedido.aggregate([
      { $match: filtroBase({ $in: ids }, null) },
      { $addFields: { valor: VALOR_PEDIDO } },
      {
        $group: {
          _id: '$cliente',
          totalPedidos: { $sum: 1 },
          valorTotal: { $sum: '$valor' },
          ultimaCompra: { $max: `$${CAMPO_DATA}` },
        },
      },
    ]);

    const totais = {};
    linhas.forEach((l) => {
      totais[l._id] = {
        totalPedidos: l.totalPedidos,
        valorTotal: l.valorTotal,
        ultimaCompra: l.ultimaCompra,
      };
    });

    return res.json({ success: true, totais });
  } catch (error) {
    console.error('Erro ao calcular totais de compras:', error);
    return res.status(500).json({ success: false, message: 'Erro ao calcular totais de compras' });
  }
};

// ───────────────────────── GET /clientes/:id/compras ─────────────────────────
// query: periodo = semana | mes | ano | todos   (padrão: mes)
//        referencia = YYYY-MM-DD (qualquer dia dentro do período desejado)
//        page, limit  (lista de pedidos)
const comprasDoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID de cliente inválido' });
    }

    const periodo = ['semana', 'mes', 'ano', 'todos'].includes(req.query.periodo) ? req.query.periodo : 'mes';
    const referencia = /^\d{4}-\d{2}-\d{2}$/.test(req.query.referencia || '') ? req.query.referencia : hojeLuanda();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const clienteId = new ObjectId(id);
    const rango = intervalo(periodo, referencia);
    const match = filtroBase(clienteId, rango);
    const formatoSerie = periodo === 'ano' || periodo === 'todos' ? '%Y-%m' : '%Y-%m-%d';

    const [agregado] = await Pedido.aggregate([
      { $match: match },
      { $addFields: { valor: VALOR_PEDIDO } },
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                totalPedidos: { $sum: 1 },
                quantidadeItens: { $sum: { $ifNull: ['$quantidade', 1] } },
                valorTotal: { $sum: '$valor' },
                maiorPedido: { $max: '$valor' },
                primeiraCompra: { $min: `$${CAMPO_DATA}` },
                ultimaCompra: { $max: `$${CAMPO_DATA}` },
              },
            },
          ],
          serie: [
            {
              $group: {
                _id: { $dateToString: { format: formatoSerie, date: `$${CAMPO_DATA}`, timezone: TZ } },
                pedidos: { $sum: 1 },
                valor: { $sum: '$valor' },
              },
            },
            { $sort: { _id: 1 } },
          ],
          porMetodo: [
            { $group: { _id: '$metodoPagamento', pedidos: { $sum: 1 }, valor: { $sum: '$valor' } } },
            { $sort: { valor: -1 } },
          ],
          porTipoProduto: [
            { $group: { _id: '$tipoProduto', pedidos: { $sum: 1 }, valor: { $sum: '$valor' } } },
            { $sort: { valor: -1 } },
            { $limit: 5 },
          ],
          ordensSaquePendentes: [
            { $match: { tipoPagamento: 'ordem_saque', 'ordemSaque.estado': 'pendente' } },
            { $group: { _id: null, quantidade: { $sum: 1 }, valor: { $sum: '$valor' } } },
          ],
        },
      },
    ]);

    // Período anterior (comparação) — não se aplica a "todos"
    let comparacao = null;
    if (periodo !== 'todos') {
      const rangoAnt = intervalo(periodo, referenciaAnterior(periodo, referencia));
      const [ant] = await Pedido.aggregate([
        { $match: filtroBase(clienteId, rangoAnt) },
        { $addFields: { valor: VALOR_PEDIDO } },
        { $group: { _id: null, pedidos: { $sum: 1 }, valor: { $sum: '$valor' } } },
      ]);
      comparacao = { pedidos: ant?.pedidos || 0, valor: ant?.valor || 0 };
    }

    // Totais gerais (sempre "desde sempre", independentemente do filtro)
    const [geral] = await Pedido.aggregate([
      { $match: filtroBase(clienteId, null) },
      { $addFields: { valor: VALOR_PEDIDO } },
      {
        $group: {
          _id: null,
          totalPedidos: { $sum: 1 },
          valorTotal: { $sum: '$valor' },
          primeiraCompra: { $min: `$${CAMPO_DATA}` },
          ultimaCompra: { $max: `$${CAMPO_DATA}` },
        },
      },
    ]);

    // Lista de pedidos do período (paginada)
    const [totalDocs, pedidosBrutos] = await Promise.all([
      Pedido.countDocuments(match),
      Pedido.find(match)
        .sort({ [CAMPO_DATA]: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(`numeroPedido tipoProduto quantidade precoUnitario valorAdicionalServico metodoPagamento tipoPagamento estado ${CAMPO_DATA}`)
        .lean(),
    ]);

    const pedidos = pedidosBrutos.map((p) => ({
      ...p,
      valor: (p.quantidade || 1) * (p.precoUnitario || 0) + (p.valorAdicionalServico || 0),
    }));

    const k = agregado.kpis[0] || {};
    const valorTotal = k.valorTotal || 0;
    const totalPedidos = k.totalPedidos || 0;
    const saque = agregado.ordensSaquePendentes[0];

    // Frequência média entre compras (em dias) — baseada no histórico completo
    let intervaloMedioDias = null;
    if (geral && geral.totalPedidos > 1) {
      const dias = (new Date(geral.ultimaCompra) - new Date(geral.primeiraCompra)) / MS_DIA;
      intervaloMedioDias = Math.round((dias / (geral.totalPedidos - 1)) * 10) / 10;
    }

    return res.json({
      success: true,
      periodo,
      referencia,
      intervalo: rango,
      kpis: {
        totalPedidos,
        quantidadeItens: k.quantidadeItens || 0,
        valorTotal,
        ticketMedio: totalPedidos ? valorTotal / totalPedidos : 0,
        maiorPedido: k.maiorPedido || 0,
        primeiraCompra: k.primeiraCompra || null,
        ultimaCompra: k.ultimaCompra || null,
      },
      geral: {
        totalPedidos: geral?.totalPedidos || 0,
        valorTotal: geral?.valorTotal || 0,
        primeiraCompra: geral?.primeiraCompra || null,
        ultimaCompra: geral?.ultimaCompra || null,
        intervaloMedioDias,
        diasDesdeUltimaCompra: geral?.ultimaCompra
          ? Math.floor((Date.now() - new Date(geral.ultimaCompra)) / MS_DIA)
          : null,
      },
      comparacao,
      serie: preencherSerie(periodo, rango, agregado.serie),
      porMetodo: agregado.porMetodo.map((m) => ({ metodo: m._id || 'Não informado', pedidos: m.pedidos, valor: m.valor })),
      porTipoProduto: agregado.porTipoProduto.map((t) => ({ tipo: t._id || 'Não informado', pedidos: t.pedidos, valor: t.valor })),
      ordensSaquePendentes: { quantidade: saque?.quantidade || 0, valor: saque?.valor || 0 },
      pedidos: {
        docs: pedidos,
        page,
        limit,
        totalDocs,
        totalPages: Math.max(1, Math.ceil(totalDocs / limit)),
        hasNext: page * limit < totalDocs,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar compras do cliente:', error);
    return res.status(500).json({ success: false, message: 'Erro ao buscar compras do cliente' });
  }
};

module.exports = { totaisCompras, comprasDoCliente };