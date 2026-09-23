const Utilizador = require('../../../models/Utilizador');

const buscarUtilizadorPorId = async (req, res) => {
  try {
    const utilizador = await Utilizador.findById(req.params.id);

    if (!utilizador) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }

    return res.status(200).json({
      success: true,
      utilizador,
      message: 'Utilizador encontrado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao buscar utilizador' });
  }
};

module.exports = buscarUtilizadorPorId;