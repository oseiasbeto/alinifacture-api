const Produto = require('../../../models/Produto'); // ajuste o caminho

const resumoProdutos = async (req, res) => {
  try {

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    // Model.aggregate() espera um ARRAY de estágios.
    const [resultado] = await Produto.aggregate([
      {
        $facet: {
          totais: [
            {
              $group: {
                _id: null,
                totalProdutos: { $sum: 1 },
                totalAtivos: { $sum: { $cond: ['$ativo', 1, 0] } },
                totalInativos: { $sum: { $cond: ['$ativo', 0, 1] } },
                totalControlamEstoque: { $sum: { $cond: ['$controlaEstoque', 1, 0] } },
                valorTotalEstoque: {
                  $sum: {
                    $cond: [
                      '$controlaEstoque',
                      { $multiply: ['$preco', { $ifNull: ['$quantidade', 0] }] },
                      0
                    ]
                  }
                }
              }
            }
          ],
          estoqueBaixo: [
            {
              $match: {
                controlaEstoque: true,
                ativo: true,
                $expr: { $lte: ['$quantidade', '$estoqueMinimo'] }
              }
            },
            { $count: 'total' }
          ],
          novosEsteMes: [
            { $match: { createdAt: { $gte: inicioMes } } },
            { $count: 'total' }
          ]
        }
      }
    ]);

    const totais = resultado?.totais?.[0] || {};
    const estoqueBaixo = resultado?.estoqueBaixo?.[0]?.total || 0;
    const novosEsteMes = resultado?.novosEsteMes?.[0]?.total || 0;

    return res.status(200).json({
      success: true,
      resumo: {
        totalProdutos: totais.totalProdutos || 0,
        totalAtivos: totais.totalAtivos || 0,
        totalInativos: totais.totalInativos || 0,
        totalControlamEstoque: totais.totalControlamEstoque || 0,
        valorTotalEstoque: totais.valorTotalEstoque || 0,
        estoqueBaixo,
        novosEsteMes
      },
      message: 'Resumo de produtos calculado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao calcular resumo de produtos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao calcular resumo de produtos'
    });
  }
};

module.exports = resumoProdutos;

// Rota sugerida (registar ANTES de qualquer rota tipo '/produtos/:id' para não haver conflito):
// router.get('/produtos/resumo', resumoProdutos);