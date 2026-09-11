const Pedido = require('../../../models/Pedido');

const resumoPedidos = async (req, res) => {
  try {
    const contagem = await Pedido.aggregate([
      { $group: { _id: '$status', total: { $sum: 1 } } },
    ]);

    const resumo = { pendente: 0, em_execucao: 0, pronto: 0, entregue: 0, cancelado: 0 };
    contagem.forEach((c) => { resumo[c._id] = c.total; });
    resumo.total = Object.values(resumo).reduce((soma, n) => soma + n, 0);

    return res.status(200).json({
      success: true,
      resumo,
      message: 'Resumo de pedidos calculado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao calcular resumo de pedidos:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao calcular resumo de pedidos' });
  }
};

module.exports = resumoPedidos;