const Produto = require('../../../models/Produto');
const Estoque = require('../../../models/Estoque');

const deletarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await Produto.findOneAndDelete({ _id: id });

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado ou não pertence à sua empresa'
      });
    }

    await Estoque.deleteMany({ produto: produto._id });

    return res.status(200).json({
      success: true,
      message: 'Produto deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao deletar o produto'
    });
  }
};

module.exports = deletarProduto;