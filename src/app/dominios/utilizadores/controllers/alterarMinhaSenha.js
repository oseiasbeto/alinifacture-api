const Utilizador = require('../../../models/Utilizador');
const bcrypt = require('bcryptjs');

const alterarMinhaSenha = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    // 1. Validações básicas (as mesmas do formulário do Navbar)
    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ success: false, message: 'Informe a senha atual e a nova senha' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ success: false, message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    if (novaSenha === senhaAtual) {
      return res.status(400).json({ success: false, message: 'A nova senha deve ser diferente da atual' });
    }

    // 2. Utilizador autenticado (vem do middleware de autenticação, nunca do body/params)
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sessão inválida' });
    }

    // select('+palavraPasse') caso o campo esteja com select: false no model
    const utilizador = await Utilizador.findById(userId).select('+palavraPasse');
    if (!utilizador) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
    }

    // 3. Confere a senha atual
    const senhaCorreta = await bcrypt.compare(senhaAtual, utilizador.palavraPasse);
    if (!senhaCorreta) {
      // 400 e não 401, para o front não interpretar como sessão expirada
      return res.status(400).json({ success: false, message: 'A senha atual está incorreta' });
    }

    // 4. Grava a nova senha
    const salt = await bcrypt.genSalt(12);
    utilizador.palavraPasse = await bcrypt.hash(novaSenha, salt);
    await utilizador.save();

    return res.status(200).json({
      success: true,
      message: 'Palavra-passe alterada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao alterar a própria senha:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao alterar a senha' });
  }
};

module.exports = alterarMinhaSenha;