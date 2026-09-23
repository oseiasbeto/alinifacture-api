const Utilizador = require('../../../models/Utilizador');

const eliminarUtilizador = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?._id?.toString() === id) {
      return res.status(400).json({ success: false, message: 'Não pode eliminar a sua própria conta' });
    }

    const utilizador = await Utilizador.findById(id);
    if (!utilizador) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }

    if (utilizador.cargo === 'administrador') {
      const totalAdmins = await Utilizador.countDocuments({ cargo: 'administrador' });
      if (totalAdmins <= 1) {
        return res.status(400).json({ success: false, message: 'Não é possível eliminar o único administrador do sistema' });
      }
    }

    await utilizador.deleteOne();

    return res.status(200).json({ success: true, message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao eliminar utilizador' });
  }
};

module.exports = eliminarUtilizador;