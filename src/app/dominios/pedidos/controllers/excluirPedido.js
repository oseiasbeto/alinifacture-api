const Pedido = require('../../../models/Pedido');

const excluirPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);

    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
    }

    return res.status(200).json({ success: true, message: 'Pedido excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao excluir pedido' });
  }
};

module.exports = excluirPedido;