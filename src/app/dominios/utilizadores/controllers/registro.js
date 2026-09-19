const bcrypt = require('bcryptjs');
const Utilizador = require('../../../models/Utilizador');
const Session = require('../../../models/Session');
const { randomUUID } = require('crypto');

const generateAccessToken = require('../../../utils/generate-access-token');
const generateRefreshToken = require('../../../utils/generate-refresh-token');
const encryptRefreshToken = require('../../../utils/encrypt-refresh-token');

const registro = async (req, res) => {
  try {
    const {
      nomeProprio,
      email,
      palavraPasse,
      telefone = null,
      cargo = 'utilizador', // ajuste para um valor válido do enum do seu model
    } = req.body;

    // 1. Validação básica
    if (!nomeProprio || !email || !palavraPasse) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e palavra-passe são obrigatórios.',
      });
    }

    if (palavraPasse.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A palavra-passe deve ter pelo menos 8 caracteres.',
      });
    }

    const cleanedEmail = email.trim().toLowerCase();

    // 2. Verifica se o email já está registado
    const emailExistente = await Utilizador.findOne({ email: cleanedEmail });
    if (emailExistente) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está registado. Faça login ou use outro email.',
      });
    }

    // 3. Hash da palavra-passe
    const salt = await bcrypt.genSalt(12);
    const palavraPasseHashed = await bcrypt.hash(palavraPasse, salt);

    // 4. Cria o utilizador
    const novoUtilizador = new Utilizador({
      nomeProprio: nomeProprio.trim(),
      email: cleanedEmail,
      palavraPasse: palavraPasseHashed,
      cargo,
      telefone: telefone ? telefone.trim() : null,
    });

    // 5. Verificar chaves JWT
    if (!process.env.JWT_ACCESS_TOKEN_SECRET || !process.env.JWT_REFRESH_TOKEN_SECRET) {
      throw new Error('Configuração de tokens JWT incompleta.');
    }

    novoUtilizador.ultimoLogin = new Date();
    await novoUtilizador.save();

    const access_token = generateAccessToken(novoUtilizador, '7d');
    const refresh_token = generateRefreshToken(novoUtilizador, '1y');
    const _encrypted_refresh_token = encryptRefreshToken(refresh_token);

    const newSession = new Session({
      id: randomUUID(),
      userAgent: (req.headers['user-agent'] || 'unknown').substring(0, 255),
      crypto: {
        key: _encrypted_refresh_token.key,
        iv: _encrypted_refresh_token.iv,
      },
      token: _encrypted_refresh_token.encrypted_refresh_token,
      user: novoUtilizador._id,
      status: 'a',
    });

    await newSession.save();

    // 6. Dados seguros para retornar
    const utilizadorResponse = {
      _id: novoUtilizador._id,
      nomeCompleto: novoUtilizador.nomeProprio,
      email: novoUtilizador.email,
      cargo: novoUtilizador.cargo,
      telefone: novoUtilizador.telefone || null,
      fotoPerfil: novoUtilizador.fotoPerfil || null,
      ultimoLogin: novoUtilizador.ultimoLogin,
      ativo: novoUtilizador.ativo,
    };

    return res.status(201).json({
      success: true,
      message: 'Utilizador registado com sucesso!',
      accessToken: access_token,
      refreshToken: refresh_token,
      sessaoId: newSession.id,
      utilizador: utilizadorResponse,
    });
  } catch (error) {
    console.error('Erro no registo:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está registado.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao registar o utilizador. Tente novamente mais tarde.',
    });
  }
};

module.exports = registro;