const Produto = require('../../../models/Produto');

const resumoEstoque = async (req, res) => {
    try {
        const [agregados] = await Produto.aggregate([
            { $match: { controlaEstoque: true } },
            {
                $group: {
                    _id: null,
                    totalControlados: { $sum: 1 },
                    totalUnidades: { $sum: '$quantidade' },
                    valorTotalCusto: { $sum: { $multiply: ['$quantidade', { $ifNull: ['$custo', 0] }] } },
                    valorTotalVenda: { $sum: { $multiply: ['$quantidade', '$preco'] } },
                },
            },
        ]);

        const totalBaixoEstoque = await Produto.countDocuments({
            controlaEstoque: true,
            $expr: { $lte: ['$quantidade', '$estoqueMinimo'] },
        });

        return res.status(200).json({
            success: true,
            resumo: {
                totalControlados: agregados?.totalControlados || 0,
                totalUnidades: agregados?.totalUnidades || 0,
                valorTotalCusto: agregados?.valorTotalCusto || 0,
                valorTotalVenda: agregados?.valorTotalVenda || 0,
                totalBaixoEstoque,
            },
            message: 'Resumo de estoque calculado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao calcular resumo de estoque:', error);
        return res.status(500).json({ success: false, message: 'Erro interno ao calcular resumo de estoque' });
    }
};

module.exports = resumoEstoque;