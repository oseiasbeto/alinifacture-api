const Pedido = require('../../../models/Pedido');
const Produto = require('../../../models/Produto');
const Despesa = require('../../../models/Despesa');

// Sem dataInicio/dataFim, o período padrão é o mês corrente.
function resolverPeriodo(query) {
  const hoje = new Date();
  const inicio = query.dataInicio
    ? new Date(`${query.dataInicio}T00:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = query.dataFim
    ? new Date(`${query.dataFim}T23:59:59.999`)
    : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
  return { inicio, fim };
}

const formatarDataChave = (data) => data.toISOString().slice(0, 10); // YYYY-MM-DD

const resumoDashboard = async (req, res) => {
  try {
    const { inicio, fim } = resolverPeriodo(req.query);

    // "Venda" = qualquer pedido criado no período cujo status não seja 'cancelado'.
    const filtroVendas = {
      createdAt: { $gte: inicio, $lte: fim },
      status: { $ne: 'cancelado' },
    };

    // Despesas do período (usa o campo "data" da despesa).
    const filtroDespesas = { data: { $gte: inicio, $lte: fim } };

    const [
      [vendasAgg],
      vendasPorDia,
      pedidosPorStatusAgg,
      [estoqueAgg],
      totalBaixoEstoque,
      topProdutos,
      [despesasAgg],
      despesasPorDia,
    ] = await Promise.all([
      Pedido.aggregate([
        { $match: filtroVendas },
        { $group: { _id: null, total: { $sum: 1 }, valorTotal: { $sum: { $ifNull: ['$valorTotal', 0] } } } },
      ]),
      Pedido.aggregate([
        { $match: filtroVendas },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            valor: { $sum: { $ifNull: ['$valorTotal', 0] } },
          },
        },
      ]),
      Pedido.aggregate([
        { $match: { createdAt: { $gte: inicio, $lte: fim } } },
        { $group: { _id: '$status', total: { $sum: 1 } } },
      ]),
      Produto.aggregate([
        { $match: { controlaEstoque: true } },
        { $group: { _id: null, valorEmEstoque: { $sum: { $multiply: ['$quantidade', { $ifNull: ['$custo', 0] }] } } } },
      ]),
      Produto.countDocuments({ controlaEstoque: true, $expr: { $lte: ['$quantidade', '$estoqueMinimo'] } }),
      Pedido.aggregate([
        { $match: filtroVendas },
        {
          $group: {
            _id: '$produto',
            quantidade: { $sum: '$quantidade' },
            valor: { $sum: { $ifNull: ['$valorTotal', 0] } },
          },
        },
        { $sort: { valor: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'produtos', localField: '_id', foreignField: '_id', as: 'produtoInfo' } },
        { $unwind: { path: '$produtoInfo', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, nome: { $ifNull: ['$produtoInfo.nome', 'Produto removido'] }, quantidade: 1, valor: 1 } },
      ]),
      // Total real de despesas no período
      Despesa.aggregate([
        { $match: filtroDespesas },
        { $group: { _id: null, total: { $sum: 1 }, valorTotal: { $sum: { $ifNull: ['$valor', 0] } } } },
      ]),
      // Despesas agrupadas por dia (para a série diária)
      Despesa.aggregate([
        { $match: filtroDespesas },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$data' } },
            valor: { $sum: { $ifNull: ['$valor', 0] } },
          },
        },
      ]),
    ]);

    const totalVendas = vendasAgg?.total || 0;
    const receitas = vendasAgg?.valorTotal || 0;
    const despesas = despesasAgg?.valorTotal || 0;
    const lucro = receitas - despesas;

    // Mapas dia -> valor, para preencher todos os dias do período (mesmo os sem movimento, com 0).
    const mapaReceitas = {};
    vendasPorDia.forEach((d) => { mapaReceitas[d._id] = d.valor; });
    const mapaDespesas = {};
    despesasPorDia.forEach((d) => { mapaDespesas[d._id] = d.valor; });

    const serieDiaria = [];
    const cursor = new Date(inicio);
    cursor.setHours(0, 0, 0, 0);
    const limite = new Date(fim);
    while (cursor <= limite) {
      const chave = formatarDataChave(cursor);
      const receitaDia = mapaReceitas[chave] || 0;
      const despesaDia = mapaDespesas[chave] || 0;
      serieDiaria.push({
        data: chave,
        receitas: receitaDia,
        despesas: despesaDia,
        lucro: receitaDia - despesaDia,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const pedidosPorStatus = { pendente: 0, em_execucao: 0, pronto: 0, entregue: 0, cancelado: 0 };
    pedidosPorStatusAgg.forEach((p) => { pedidosPorStatus[p._id] = p.total; });
    const totalPedidos = Object.values(pedidosPorStatus).reduce((soma, n) => soma + n, 0);

    return res.status(200).json({
      success: true,
      dashboard: {
        periodo: { dataInicio: formatarDataChave(inicio), dataFim: formatarDataChave(fim) },

        vendas: { total: totalVendas, valorTotal: receitas },
        receitas,

        despesas,
        despesasDisponivel: true,
        totalDespesas: despesasAgg?.total || 0,
        lucro,

        serieDiaria,
        pedidos: { total: totalPedidos, porStatus: pedidosPorStatus },
        estoque: {
          valorEmEstoque: estoqueAgg?.valorEmEstoque || 0,
          totalBaixoEstoque,
        },
        topProdutos,
      },
      message: 'Dashboard calculado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao calcular dashboard:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao calcular dashboard' });
  }
};

module.exports = resumoDashboard;