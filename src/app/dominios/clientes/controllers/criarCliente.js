const Cliente = require('../../../models/Cliente');

const criarCliente = async (req, res) => {
  try {
    const empresaId = req.user?.empresa || req.empresa;

    if (!empresaId) {
      return res.status(401).json({ success: false, message: 'Empresa não identificada' });
    }

    const {
      nome,
      email,
      telefone,
      nif,
      endereco,
      cidade = 'Luanda',
      provincia = 'Luanda',
      tipo = 'coletivo',
      observacoes,
      ativo = true
    } = req.body;

    if (!nome) {
      return res.status(400).json({ success: false, message: 'Nome do cliente é obrigatório' });
    }

    const clienteExistente = await Cliente.findOne({ empresa: empresaId, nif: nif ? nif.trim() : undefined });

    if (clienteExistente) {
      return res.status(400).json({ success: false, message: 'NIF já existe para outro cliente nesta empresa' });
    }

    const novoCliente = new Cliente({
      nome: nome.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      telefone,
      nif: nif ? nif.trim() : undefined,
      endereco: endereco ? endereco.trim() : undefined,
      cidade,
      provincia,
      tipo,
      observacoes: observacoes ? observacoes.trim() : undefined,
      ativo,
      empresa: empresaId
    });

    await novoCliente.save();

    return res.status(201).json({
      success: true,
      message: 'Cliente criado com sucesso',
      cliente: novoCliente
    });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao criar cliente' });
  }
};

module.exports = criarCliente;