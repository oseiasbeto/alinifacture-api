const Utilizador = require('../../../models/Utilizador');
const gerarPalavraPasse = require('../../../utils/gerarPalavraPasse'); // ajuste o caminho conforme necessário
const bcrypt = require('bcryptjs');

const redefinirSenhaUtilizador = async (req, res) => {
  try {
    const utilizador = await Utilizador.findById(req.params.id);
    if (!utilizador) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }

    const novaSenha = gerarPalavraPasse();
    const salt = await bcrypt.genSalt(12);
    const palavraPasseHashed = await bcrypt.hash(novaSenha, salt);
    
    utilizador.palavraPasse = palavraPasseHashed; // o hook pre('save') do model encripta automaticamente
    await utilizador.save();

    return res.status(200).json({
      success: true,
      senhaGerada: novaSenha, // única vez que aparece em texto simples
      message: 'Palavra-passe redefinida com sucesso',
    });
  } catch (error) {
    console.error('Erro ao redefinir senha do utilizador:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao redefinir a senha' });
  }
};

module.exports = redefinirSenhaUtilizador;