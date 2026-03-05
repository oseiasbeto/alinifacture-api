const Cliente = require('../../../models/Cliente');

const atualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user?.empresa || req.empresa?._id;

    if (!empresaId) {
      return res.status(401).json({ success: false, message: 'Empresa não identificada' });
    }

    const cliente = await Cliente.findOne({ _id: id, empresa: empresaId });

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'empresa') {
        cliente[key] = updates[key];
      }
    });

    await cliente.save();

    return res.status(200).json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      cliente
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'NIF já existe para outro cliente nesta empresa' });
    }
    console.error('Erro ao atualizar cliente:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao atualizar cliente' });
  }
};

module.exports = atualizarCliente;