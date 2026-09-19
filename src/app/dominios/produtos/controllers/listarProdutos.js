const Produto = require('../../../models/Produto'); // ajuste o caminho

const listarProdutos = async (req, res) => {
  try {
    let ativoFilter = null;
    if (req.query.ativo !== undefined && req.query.ativo !== '') {
      // Converte string para boolean
      ativoFilter = req.query.ativo === 'true' || req.query.ativo === true;
    }

    // Parâmetros
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const busca = req.query.busca ? req.query.busca.trim() : null;

    // Filtro
    const filter = {};
    if (busca) {
      filter.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { codigo: { $regex: busca, $options: 'i' } },
        { descricao: { $regex: busca, $options: 'i' } },
      ];
    }

    // Filtro por ativo/inativo (só adiciona se o parâmetro veio)
    if (ativoFilter !== null) {
      filter.ativo = ativoFilter;
    }

    // Opções de paginação (só dois argumentos!)
    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      lean: true,
      projection: {
        nome: 1,
        codigo: 1,
        descricao: 1,
        quantidade: 1,
        custo: 1,
        cor: 1,
        preco: 1,
        unidade: 1,
        controlaEstoque: 1,
        estoqueMinimo: 1,
        empresa: 1,
        tributavel: 1,
        ativo: 1,
        createdAt: 1
      }
    };

    // CHAMADA CORRETA: await + apenas filter e options
    const result = await Produto.paginate(filter, options);

    return res.status(200).json({
      success: true,
      message: 'Produtos listados com sucesso',
      data: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage
      }
    });

  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao listar os produtos'
    });
  }
};

module.exports = listarProdutos;