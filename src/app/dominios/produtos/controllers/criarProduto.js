const Produto = require('../../../models/Produto'); // ajuste o caminho correto para o modelo Produto

const criarProduto = async (req, res) => {
  try {
    // 1. Extrai os dados do body
    const {
      nome,
      codigo,          // opcional
      descricao,
      preco,
      quantidade,
      custo,
      unidade = 'un',
      cor,
      tributavel = true,
      controlaEstoque = false,
      estoqueMinimo = 0,
      ativo = true,
      // NÃO pegamos 'empresa' do body — vem do utilizador autenticado
    } = req.body;

    // 2. Validação básica (além do que o schema já faz)
    if (!nome || !preco) {
      return res.status(400).json({
        success: false,
        message: 'Nome do produto e preço unitário são obrigatórios.'
      });
    }

    if (preco < 0) {
      return res.status(400).json({
        success: false,
        message: 'O preço não pode ser negativo.'
      });
    }

    // 3. Pega a empresa do utilizador autenticado (exemplo comum)

    // 4. Cria o novo produto
    const novoProduto = new Produto({
      nome: nome.trim(),
      codigo: codigo ? codigo.trim().toUpperCase() : undefined,
      descricao: descricao ? descricao.trim() : undefined,
      preco: preco,
      unidade,
      tributavel,
      cor,
      quantidade: quantidade || 0,
      custo: custo || 0,
      ativo,
      controlaEstoque,
      estoqueMinimo,
      criadoPor: req.user.id
    });

    // 5. Salva no banco
    await novoProduto.save();

    // 6. Resposta de sucesso (retorna o produto criado, sem dados sensíveis)
    return res.status(201).json({
      success: true,
      message: 'Produto registrado com sucesso!',
      produto: {
        _id: novoProduto._id,
        nome: novoProduto.nome,
        codigo: novoProduto.codigo,
        descricao: novoProduto.descricao,
        preco: novoProduto.preco,
        unidade: novoProduto.unidade,
        tributavel: novoProduto.tributavel,
        ativo: novoProduto.ativo,
        createdAt: novoProduto.createdAt
      }
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);

    // Trata erros de validação do Mongoose
    if (error.name === 'ValidationError') {
      const mensagens = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: mensagens
      });
    }

    // Erro genérico
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao registrar o produto. Tente novamente mais tarde.'
    });
  }
};

module.exports = criarProduto;