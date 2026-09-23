const Utilizador = require('../../../models/Utilizador');

const resumoUtilizadores = async (req, res) => {
  try {
    const [resultado] = await Utilizador.aggregate([
      {
        $facet: {
          porCargo: [{ $group: { _id: '$cargo', total: { $sum: 1 } } }],
          porStatus: [{ $group: { _id: '$ativo', total: { $sum: 1 } } }],
        },
      },
    ]);

    const porCargo = { administrador: 0, caixa: 0, designer: 0, visualizador: 0 };
    (resultado?.porCargo || []).forEach((c) => { porCargo[c._id] = c.total; });

    let ativos = 0;
    let inativos = 0;
    (resultado?.porStatus || []).forEach((s) => {
      if (s._id === true) ativos = s.total;
      else inativos = s.total;
    });

    return res.status(200).json({
      success: true,
      resumo: {
        total: ativos + inativos,
        ativos,
        inativos,
        porCargo,
      },
      message: 'Resumo de utilizadores calculado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao calcular resumo de utilizadores:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao calcular resumo de utilizadores' });
  }
};

module.exports = resumoUtilizadores;