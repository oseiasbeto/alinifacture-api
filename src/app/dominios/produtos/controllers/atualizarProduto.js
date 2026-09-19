const Produto = require('../../../models/Produto');

const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await Produto.findOne({ _id: id });

    if (!produto) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado ou não pertence à sua empresa' });
    }

    // Atualiza apenas os campos enviados
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'empresa' && key !== '_id') { // protege campos sensíveis
        produto[key] = updates[key];
      }
    });

    await produto.save();

    return res.status(200).json({
      success: true,
      message: 'Produto atualizado com sucesso',
      produto
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar o produto'
    });
  }
};

module.exports = atualizarProduto;