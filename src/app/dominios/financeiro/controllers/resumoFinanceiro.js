const ContaPagar = require('../../../models/ContaPagar');
const ContaReceber = require('../../../models/ContaReceber');

const resumoFinanceiro = async (req, res) => {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const [
      [receberAgg],
      [pagarAgg],
      vencidasReceber,
      vencidasPagar,
      [recebidoMesAgg],
      [pagoMesAgg],
    ] = await Promise.all([
      ContaReceber.aggregate([
        { $match: { status: 'pendente' } },
        { $group: { _id: null, total: { $sum: '$valor' }, count: { $sum: 1 } } },
      ]),
      ContaPagar.aggregate([
        { $match: { status: 'pendente' } },
        { $group: { _id: null, total: { $sum: '$valor' }, count: { $sum: 1 } } },
      ]),
      ContaReceber.countDocuments({ status: 'pendente', dataVencimento: { $lt: hoje } }),
      ContaPagar.countDocuments({ status: 'pendente', dataVencimento: { $lt: hoje } }),
      ContaReceber.aggregate([
        { $match: { status: 'recebido', dataRecebimento: { $gte: inicioMes } } },
        { $group: { _id: null, total: { $sum: '$valor' } } },
      ]),
      ContaPagar.aggregate([
        { $match: { status: 'pago', dataPagamento: { $gte: inicioMes } } },
        { $group: { _id: null, total: { $sum: '$valor' } } },
      ]),
    ]);

    const totalAReceber = receberAgg?.total || 0;
    const totalAPagar = pagarAgg?.total || 0;

    return res.status(200).json({
      success: true,
      resumo: {
        totalAReceber,
        totalAPagar,
        saldoPrevisto: totalAReceber - totalAPagar,
        contasVencidas: vencidasReceber + vencidasPagar,
        recebidoEsteMes: recebidoMesAgg?.total || 0,
        pagoEsteMes: pagoMesAgg?.total || 0,
      },
      message: 'Resumo financeiro calculado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao calcular resumo financeiro:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao calcular resumo financeiro' });
  }
};

module.exports = resumoFinanceiro;