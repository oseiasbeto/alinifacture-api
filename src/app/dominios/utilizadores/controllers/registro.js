const bcrypt = require('bcryptjs');
const Empresa = require('../../../models/Empresa'); // ajuste o caminho correto
const Utilizador = require('../../../models/Utilizador');
const Session = require('../../../models/Session');
const moment = require('moment');
const { randomUUID } = require("crypto")

const generateAccessToken = require('../../../utils/generate-access-token');
const generateRefreshToken = require('../../../utils/generate-refresh-token');
const encryptRefreshToken = require('../../../utils/encrypt-refresh-token');

const registro = async (req, res) => {
  try {
    const {
      nomeProprio,
      email,
      palavraPasse,
      nomeEmpresa, // ← NOVO CAMPO OBRIGATÓRIO NO BODY
      telefone = null,
      nifEmpresa = null, // opcional
      cargo = 'proprietario' // o primeiro utilizador é proprietário
    } = req.body;

    // 1. Validação básica
    if (!nomeProprio || !email || !palavraPasse || !nomeEmpresa) {
      return res.status(400).json({
        success: false,
        message: 'Nome próprio, email, palavra-passe e nome da empresa são obrigatórios.'
      });
    }

    if (palavraPasse.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A palavra-passe deve ter pelo menos 8 caracteres.'
      });
    }

    const cleanedEmail = email.trim().toLowerCase();
    const nomeEmpresaLimpo = nomeEmpresa.trim();

    // 2. Verifica se o email já está registado
    const emailExistente = await Utilizador.findOne({ email: cleanedEmail });
    if (emailExistente) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está registado. Faça login ou use outro email.'
      });
    }

    // 3. Verifica se o nome da empresa já existe
    const empresaExistente = await Empresa.findOne({ nome: nomeEmpresaLimpo });
    if (empresaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma empresa com este nome.'
      });
    }

    // 4. Hash da palavra-passe
    const salt = await bcrypt.genSalt(12);
    const palavraPasseHashed = await bcrypt.hash(palavraPasse, salt);

    // 5. Cria a Empresa primeiro (o utilizador será o proprietário)
    const novaEmpresa = new Empresa({
      nome: nomeEmpresaLimpo,
      nif: nifEmpresa ? nifEmpresa.trim() : null,
      proprietario: null, // será atualizado após criar o utilizador
      ativo: true
    });

    await novaEmpresa.save();

    // 6. Cria o novo utilizador (com cargo 'proprietario' por padrão)
    const novoUtilizador = new Utilizador({
      nomeProprio: nomeProprio.trim(),
      email: cleanedEmail,
      palavraPasse: palavraPasseHashed,
      cargo, // o criador é sempre proprietário
      telefone: telefone ? telefone.trim() : null,
      empresa: novaEmpresa._id // associa à empresa recém-criada
    });

    await novoUtilizador.save();

    // 7. Atualiza a empresa com o ID do proprietário
    novaEmpresa.proprietario = novoUtilizador._id;
    await novaEmpresa.save();

    // Verificar chaves JWT
    if (!process.env.JWT_ACCESS_TOKEN_SECRET || !process.env.JWT_REFRESH_TOKEN_SECRET) {
      throw new Error("Configuração de tokens JWT incompleta.");
    }

    const expires_access_token_in = "7d";
    const expires_refresh_token_in = "1y";

    const access_token = generateAccessToken(novoUtilizador, expires_access_token_in);
    const refresh_token = generateRefreshToken(novoUtilizador, expires_refresh_token_in);
    const _encrypted_refresh_token = encryptRefreshToken(refresh_token);


    const newSession = new Session({
      id: randomUUID(),
      userAgent: (req.headers["user-agent"] || "unknown").substring(0, 255), // Limitar tamanho
      crypto: {
        key: _encrypted_refresh_token.key,
        iv: _encrypted_refresh_token.iv,
      },
      token: _encrypted_refresh_token.encrypted_refresh_token,
      user: novoUtilizador._id,
      status: "a", // Garantir status explícito
    });

    // 10. Atualiza último login
    novoUtilizador.ultimoLogin = new Date();
    await novoUtilizador.save();

    await newSession.save();

    // 11. Dados seguros para retornar
    const utilizadorResponse = {
      _id: novoUtilizador._id,
      nomeCompleto: novoUtilizador.nomeProprio,
      email: novoUtilizador.email,
      cargo: novoUtilizador.cargo,
      empresa: novaEmpresa,
      telefone: novoUtilizador.telefone || null,
      fotoPerfil: novoUtilizador.fotoPerfil || null,
      ultimoLogin: novoUtilizador.ultimoLogin,
      ativo: novoUtilizador.ativo
    };

    // 12. Resposta final (registo + login automático)
    return res.status(201).json({
      success: true,
      message: 'Conta e empresa criadas com sucesso! Já pode começar a usar o Alinifacture.',
      accessToken: access_token,
      refreshToken: refresh_token,
      sessaoId: newSession.id,
      utilizador: utilizadorResponse
    });

  } catch (error) {
    console.error('Erro no registo:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Este email ou nome de empresa já está registado.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao criar a conta e empresa. Tente novamente mais tarde.'
    });
  }
};

module.exports = registro;