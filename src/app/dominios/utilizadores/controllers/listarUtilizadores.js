const Utilizador = require('../../../models/Utilizador');

const listarUtilizadores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { cargo, ativo, busca } = req.query;

    const filter = {};
    if (cargo) filter.cargo = cargo;
    if (ativo !== undefined && ativo !== '') filter.ativo = ativo === 'true' || ativo === true;
    if (busca) {
      const regex = { $regex: busca.trim(), $options: 'i' };
      filter.$or = [{ nomeProprio: regex }, { apelido: regex }, { email: regex }];
    }

    const skip = (page - 1) * limit;
    const [utilizadores, totalDocs] = await Promise.all([
      Utilizador.find(filter).sort({ nomeProprio: 1 }).skip(skip).limit(limit).lean(),
      Utilizador.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      utilizadores,
      pagination: {
        page,
        limit,
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit) || 1,
        hasNextPage: page * limit < totalDocs,
        hasPrevPage: page > 1,
      },
      message: 'Utilizadores listados com sucesso',
    });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao listar utilizadores' });
  }
};

module.exports = listarUtilizadores;