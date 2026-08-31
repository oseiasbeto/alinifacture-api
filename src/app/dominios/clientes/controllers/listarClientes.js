const Cliente = require('../../../models/Cliente');

const listarClientes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const busca = req.query.busca ? req.query.busca.trim() : null;
    const ativo = req.query.ativo; // 'true', 'false' ou undefined

    const filter = {  };

    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { email: { $regex: busca, $options: 'i' } },
        { telefone: { $regex: busca, $options: 'i' } },
        { nif: { $regex: busca, $options: 'i' } }
      ];
    }

    if (ativo !== undefined && ativo !== '') {
      filter.ativo = ativo === 'true' || ativo === true;
    }

    const options = {
      page,
      limit,
      sort: { nome: 1 }, // ordena por nome alfabético
      lean: true,
      projection: {
        nome: 1,
        email: 1,
        telefone: 1,
        nif: 1,
        endereco: 1,
        observacoes: 1,
        cidade: 1,
        provincia: 1,
        tipo: 1,
        ativo: 1,
        createdAt: 1
      }
    };

    const result = await Cliente.paginate(filter, options);

    return res.status(200).json({
      success: true,
      message: 'Clientes listados com sucesso',
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage
      }
    });

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao listar clientes' });
  }
};

module.exports = listarClientes;