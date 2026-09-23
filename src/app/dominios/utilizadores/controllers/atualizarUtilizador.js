const Utilizador = require('../../../models/Utilizador');

const CARGOS_VALIDOS = ['administrador', 'caixa', 'estoquista', 'designer', 'visualizador'];

const atualizarUtilizador = async (req, res) => {
  try {
    const { nomeProprio, apelido, email, telefone, cargo, ativo } = req.body;

    if (cargo && !CARGOS_VALIDOS.includes(cargo)) {
      return res.status(400).json({ success: false, message: 'Cargo inválido' });
    }

    if (email) {
      const emailEmUso = await Utilizador.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.params.id } });
      if (emailEmUso) {
        return res.status(400).json({ success: false, message: 'Já existe outro utilizador com este email' });
      }
    }

    const utilizador = await Utilizador.findByIdAndUpdate(
      req.params.id,
      {
        nomeProprio: nomeProprio?.trim(),
        apelido: apelido?.trim(),
        email: email?.trim().toLowerCase(),
        telefone: telefone?.trim(),
        cargo,
        ativo,
      },
      { new: true, runValidators: true, omitUndefined: true }
    );

    if (!utilizador) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }

    return res.status(200).json({ success: true, utilizador, message: 'Utilizador atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao atualizar utilizador' });
  }
};

module.exports = atualizarUtilizador;