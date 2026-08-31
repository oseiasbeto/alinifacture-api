const Produto = require('../../../models/Produto');
const Estoque = require('../../../models/Estoque');

const listarNiveis = async (req, res) => {
    try {
        const { page = 1, limit = 10, busca, baixoEstoque, produtoId } = req.query;

        const filtro = { controlaEstoque: true };
        if (produtoId) filtro._id = produtoId;
        else if (busca) filtro.$text = { $search: busca };

        let resultado = await Produto.paginate(filtro, {
            page: Number(page),
            limit: Number(limit),
            sort: { nome: 1 },
        });

        if (baixoEstoque === 'true') {
            resultado.docs = resultado.docs.filter((p) => p.quantidade <= p.estoqueMinimo);
        }

        return res.status(200).json({
            success: true,
            niveis: resultado.docs,
            pagination: {
                page: resultado.page,
                limit: resultado.limit,
                totalDocs: resultado.totalDocs,
                totalPages: resultado.totalPages,
                hasNextPage: resultado.hasNextPage,
            },
            message: 'Níveis de estoque listados com sucesso',
        });
    } catch (error) {
        console.error('Erro ao listar níveis de estoque:', error);
        return res.status(500).json({ success: false, message: 'Erro interno ao listar níveis de estoque' });
    }
};

module.exports = listarNiveis;