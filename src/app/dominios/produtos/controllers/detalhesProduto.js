const Produto = require('../../../models/Produto');

const detalhesProduto = async (req, res) => {
  try {
    const { id } = req.params;
  
    const produto = await Produto.findById(id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      produto,
      message: 'Produto deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar o produto'
    });
  }
};

module.exports = detalhesProduto;