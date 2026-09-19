const Cliente = require('../../../models/Cliente');

const criarCliente = async (req, res) => {
  try {
    
    const {
      nome,
      email,
      telefone,
      nif,
      endereco,
      cidade = 'Saurimo',
      provincia = 'Lunda-sul',
      tipo = 'singular',
      observacoes,
      ativo = true
    } = req.body;

    if (!nome) {
      return res.status(400).json({ success: false, message: 'Nome do cliente é obrigatório' });
    }

    // NIF é opcional — só verificamos duplicidade quando ele vem mesmo preenchido.
    // Caso contrário, Cliente.findOne({ nif: undefined }) removeria a chave do filtro
    // e acabaria por devolver o primeiro cliente da coleção (bug).
    const nifTratado = nif && nif.trim() ? nif.trim() : null;

    if (nifTratado) {
      const clienteExistente = await Cliente.findOne({ nif: nifTratado });

      if (clienteExistente) {
        return res.status(400).json({ success: false, message: 'NIF já existe para outro cliente.' });
      }
    }

    const novoCliente = new Cliente({
      nome: nome.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      telefone,
      nif: nifTratado || undefined,
      endereco: endereco ? endereco.trim() : undefined,
      cidade,
      provincia,
      tipo,
      observacoes: observacoes ? observacoes.trim() : undefined,
      ativo
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