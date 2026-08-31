const Produto = require('../../../models/Produto');
const Estoque = require('../../../models/Estoque');

const listarMovimentos = async (req, res) => {
    try {
        const { page = 1, limit = 10, produto, dataInicio, dataFim } = req.query;
        const filtro = {};

        if (produto) filtro.produto = produto;

        if (dataInicio || dataFim) {
            filtro.createdAt = {};
            if (dataInicio) filtro.createdAt.$gte = new Date(`${dataInicio}T00:00:00.000`);
            if (dataFim) filtro.createdAt.$lte = new Date(`${dataFim}T23:59:59.999`);
        }

        const resultado = await Estoque.paginate(filtro, {
            page: Number(page),
            limit: Number(limit),
            sort: { createdAt: -1 },
            populate: [
                { path: 'produto', select: 'nome codigo cor' },
                { path: 'usuario', select: 'nomeProprio' },
            ],
        });

        return res.status(200).json({
            success: true,
            movimentos: resultado.docs,
            pagination: {
                page: resultado.page,
                limit: resultado.limit,
                totalDocs: resultado.totalDocs,
                totalPages: resultado.totalPages,
                hasNextPage: resultado.hasNextPage,
            },
            message: 'Movimentos listados com sucesso',
        });
    } catch (error) {
        console.error('Erro ao listar movimentos de estoque:', error);
        return res.status(500).json({ success: false, message: 'Erro interno ao listar movimentos de estoque' });
    }
};

module.exports = listarMovimentos;