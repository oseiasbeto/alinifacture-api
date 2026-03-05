const Cliente = require('../../../models/Cliente');

const deletarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user?.empresa || req.empresa?._id;

    if (!empresaId) {
      return res.status(401).json({ success: false, message: 'Empresa não identificada' });
    }

    const cliente = await Cliente.findOneAndDelete({ _id: id, empresa: empresaId });

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }

    return res.status(200).json({
      success: true,
      message: 'Cliente deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao deletar cliente' });
  }
};

module.exports = deletarCliente;