const Pedido = require('../../../models/Pedido');
const Utilizador = require('../../../models/Utilizador');

// O ranking é calculado a partir do historicoStatus: cada entrada guarda QUEM fez a
// mudança e QUANDO.
//
// papel      -> o que conta
// caixa      -> pedidos criados/atendidos no período
// designer   -> pedidos que o utilizador marcou como "pronto" no período
// producao   -> pedidos que o utilizador marcou como "entregue" no período
const PAPEIS = {
  caixa: { tipo: 'criacao' },
  designer: { tipo: 'historico', statusAlvo: 'pronto' },
  producao: { tipo: 'historico', statusAlvo: 'pronto_entrega' },
};

// Luanda = UTC+1 (sem horário de verão)
const TZ = '+01:00';
const UMA_HORA = 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

// Converte um instante para a data (YYYY-MM-DD) no fuso de Luanda.
const dataLuanda = (d) => new Date(d.getTime() + UMA_HORA).toISOString().slice(0, 10);

// Sem dataInicio/dataFim, o período padrão é o mês corrente.
function resolverPeriodo(query) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  const strInicio = query.dataInicio || `${ano}-${pad(mes + 1)}-01`;
  const strFim = query.dataFim || `${ano}-${pad(mes + 1)}-${pad(ultimoDia)}`;

  return {
    inicio: new Date(`${strInicio}T00:00:00${TZ}`),
    fim: new Date(`${strFim}T23:59:59.999${TZ}`),
    strInicio,
    strFim,
  };
}

// Ordenar, buscar dados do utilizador e formatar.
function etapasFinais() {
  return [
    { $sort: { totalPedidos: -1, valorTotal: -1 } },
    {
      $lookup: {
        from: Utilizador.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'utilizadorInfo',
      },
    },
    { $unwind: '$utilizadorInfo' },
    {
      $project: {
        _id: 0,
        utilizador: {
          _id: '$utilizadorInfo._id',
          nomeProprio: '$utilizadorInfo.nomeProprio',
          apelido: '$utilizadorInfo.apelido',
          cargo: '$utilizadorInfo.cargo',
          ativo: '$utilizadorInfo.ativo',
        },
        totalPedidos: 1,
        valorTotal: 1,
      },
    },
    { $sort: { totalPedidos: -1, valorTotal: -1 } },
  ];
}

function pipelineCriacao(inicio, fim) {
  return [
    { $match: { createdAt: { $gte: inicio, $lte: fim }, status: { $ne: 'cancelado' } } },
    {
      $group: {
        // Quem criou (1.ª entrada do histórico); se faltar, usa o atendente do pedido.
        _id: {
          $let: {
            vars: { primeiro: { $arrayElemAt: ['$historicoStatus', 0] } },
            in: { $ifNull: ['$$primeiro.usuario', '$atendente'] },
          },
        },
        totalPedidos: { $sum: 1 },
        valorTotal: { $sum: { $ifNull: ['$valorTotal', 0] } },
      },
    },
    { $match: { _id: { $ne: null } } },
    ...etapasFinais(),
  ];
}

function pipelineHistorico(statusAlvo, inicio, fim) {
  return [
    {
      $match: {
        status: { $ne: 'cancelado' },
        historicoStatus: { $elemMatch: { status: statusAlvo, data: { $gte: inicio, $lte: fim } } },
      },
    },
    { $unwind: '$historicoStatus' },
    {
      $match: {
        'historicoStatus.status': statusAlvo,
        'historicoStatus.data': { $gte: inicio, $lte: fim },
        'historicoStatus.usuario': { $ne: null },
      },
    },
    // Um pedido conta uma vez por pessoa, mesmo que tenha passado várias vezes pelo status.
    {
      $group: {
        _id: { pedido: '$_id', usuario: '$historicoStatus.usuario' },
        valorTotal: { $first: { $ifNull: ['$valorTotal', 0] } },
      },
    },
    {
      $group: {
        _id: '$_id.usuario',
        totalPedidos: { $sum: 1 },
        valorTotal: { $sum: '$valorTotal' },
      },
    },
    ...etapasFinais(),
  ];
}

const calcularRanking = (config, inicio, fim) =>
  Pedido.aggregate(
    config.tipo === 'criacao'
      ? pipelineCriacao(inicio, fim)
      : pipelineHistorico(config.statusAlvo, inicio, fim)
  );

// Posições com empate (1, 1, 3...): quem tem exatamente os mesmos números
// fica na mesma posição, para ninguém ser prejudicado por desempate arbitrário.
function atribuirPosicoes(lista) {
  let posicaoAtual = 0;
  return lista.map((r, i) => {
    const anterior = lista[i - 1];
    if (!anterior || anterior.totalPedidos !== r.totalPedidos || anterior.valorTotal !== r.valorTotal) {
      posicaoAtual = i + 1;
    }
    return { ...r, posicao: posicaoAtual };
  });
}

const rankingFuncionarios = async (req, res) => {
  try {
    const papel = PAPEIS[req.query.papel] ? req.query.papel : 'producao';
    const config = PAPEIS[papel];

    const { inicio, fim, strInicio, strFim } = resolverPeriodo(req.query);

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return res.status(400).json({ success: false, message: 'Datas inválidas. Use o formato YYYY-MM-DD' });
    }
    if (inicio > fim) {
      return res.status(400).json({ success: false, message: 'dataInicio não pode ser posterior a dataFim' });
    }

    // Período anterior, com a mesma duração, para mostrar a evolução de cada pessoa.
    const duracao = fim.getTime() - inicio.getTime() + 1;
    const fimAnterior = new Date(inicio.getTime() - 1);
    const inicioAnterior = new Date(inicio.getTime() - duracao);

    const [atualBruto, anteriorBruto] = await Promise.all([
      calcularRanking(config, inicio, fim),
      calcularRanking(config, inicioAnterior, fimAnterior),
    ]);

    const anterior = atribuirPosicoes(anteriorBruto);
    const mapaAnterior = new Map(anterior.map((r) => [String(r.utilizador._id), r]));

    const ranking = atribuirPosicoes(atualBruto).map((r) => {
      const ant = mapaAnterior.get(String(r.utilizador._id));
      return {
        ...r,
        anterior: ant ? { totalPedidos: ant.totalPedidos, posicao: ant.posicao } : null,
      };
    });

    const resposta = {
      success: true,
      papel,
      periodo: { dataInicio: strInicio, dataFim: strFim },
      periodoAnterior: { dataInicio: dataLuanda(inicioAnterior), dataFim: dataLuanda(fimAnterior) },
      ranking,
      message: 'Classificação calculada com sucesso',
    };

    // Diagnóstico: GET /...?papel=designer&debug=1
    if (req.query.debug === '1') {
      resposta.debug = {
        colecaoUtilizadores: Utilizador.collection.name,
        totalPedidos: await Pedido.countDocuments(),
        comHistorico: await Pedido.countDocuments({ 'historicoStatus.0': { $exists: true } }),
        funcionariosNoRanking: ranking.length,
        funcionariosPeriodoAnterior: anterior.length,
      };
    }

    return res.status(200).json(resposta);
  } catch (error) {
    console.error('Erro ao calcular classificação de funcionários:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao calcular classificação' });
  }
};

module.exports = rankingFuncionarios;