const Utilizador = require('../../../models/Utilizador');
const gerarPalavraPasse = require('../../../utils/gerarPalavraPasse'); // ajuste o caminho conforme necessário
const bcrypt = require('bcryptjs');

const CARGOS_VALIDOS = ['administrador', 'caixa', 'estoquista', 'designer', 'visualizador'];

const criarUtilizador = async (req, res) => {
  try {
    const { nomeProprio, apelido, email, telefone, cargo } = req.body;

    if (!nomeProprio?.trim()) {
      return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email é obrigatório' });
    }
    if (cargo && !CARGOS_VALIDOS.includes(cargo)) {
      return res.status(400).json({ success: false, message: 'Cargo inválido' });
    }

    const emailExistente = await Utilizador.findOne({ email: email.trim().toLowerCase() });
    if (emailExistente) {
      return res.status(400).json({ success: false, message: 'Já existe um utilizador com este email' });
    }

    // A senha nunca é pedida no formulário — é sempre gerada aqui, para garantir uma senha forte por padrão.
    const senhaGerada = gerarPalavraPasse();
    const salt = await bcrypt.genSalt(12);
    const palavraPasseHashed = await bcrypt.hash(senhaGerada, salt);

    const utilizador = new Utilizador({
      nomeProprio: nomeProprio.trim(),
      apelido: apelido?.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone?.trim(),
      cargo: cargo || 'visualizador',
      palavraPasse: palavraPasseHashed,
    });

    await utilizador.save();

    const utilizadorSemSenha = utilizador.toObject();
    delete utilizadorSemSenha.senha;

    return res.status(201).json({
      success: true,
      utilizador: utilizadorSemSenha,
      // ATENÇÃO: esta é a única vez que a senha em texto simples é devolvida pela API.
      // O hash é a única coisa guardada na base de dados — se se perder, só resta redefinir.
      senhaGerada,
      message: 'Utilizador criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao criar utilizador' });
  }
};

module.exports = criarUtilizador;