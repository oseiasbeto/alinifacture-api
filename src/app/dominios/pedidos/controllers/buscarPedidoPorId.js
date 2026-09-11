const Pedido = require('../../../models/Pedido');

const buscarPedidoPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('cliente', 'nome telefone email nif')
      .populate('produto', 'nome cor')
      .populate('atendente', 'nomeProprio')
      .populate('responsavelProducao', 'nome')
      .populate('produto', 'nome')
      .populate('historicoStatus.usuario', 'nomeProprio');

    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    return res.status(200).json({
      success: true,
      pedido,
      message: 'Pedido encontrado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao buscar pedido' });
  }
};

module.exports = buscarPedidoPorId;