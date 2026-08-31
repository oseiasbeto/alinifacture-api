const Cliente = require('../../../models/Cliente');

const resumoClientes = async (req, res) => {
  try {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    // Model.aggregate() espera um ARRAY de estágios.
    const [resultado] = await Cliente.aggregate([
      {
        $facet: {
          totais: [
            {
              $group: {
                _id: null,
                totalClientes: { $sum: 1 },
                totalAtivos: { $sum: { $cond: ['$ativo', 1, 0] } },
                totalInativos: { $sum: { $cond: ['$ativo', 0, 1] } },
                totalSingulares: { $sum: { $cond: [{ $eq: ['$tipo', 'singular'] }, 1, 0] } },
                totalColetivos: { $sum: { $cond: [{ $eq: ['$tipo', 'coletivo'] }, 1, 0] } },
              },
            },
          ],
          novosEsteMes: [
            { $match: { createdAt: { $gte: inicioMes } } },
            { $count: 'total' },
          ],
        },
      },
    ]);

    const totais = resultado?.totais?.[0] || {};
    const novosEsteMes = resultado?.novosEsteMes?.[0]?.total || 0;

    return res.status(200).json({
      success: true,
      resumo: {
        totalClientes: totais.totalClientes || 0,
        totalAtivos: totais.totalAtivos || 0,
        totalInativos: totais.totalInativos || 0,
        totalSingulares: totais.totalSingulares || 0,
        totalColetivos: totais.totalColetivos || 0,
        novosEsteMes,
      },
      message: 'Resumo de clientes calculado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao calcular resumo de clientes:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao calcular resumo de clientes' });
  }
};

module.exports = resumoClientes;

// Rota sugerida (registar ANTES de qualquer rota tipo '/clientes/:id' para não haver conflito):
// router.get('/clientes/resumo', resumoClientes);