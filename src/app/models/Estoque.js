const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const movimentoEstoqueSchema = new mongoose.Schema(
  {
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },

    tipo: { type: String, enum: ['entrada', 'saida', 'ajuste'], required: true },

    quantidade: { type: Number, required: true, min: 0 }, // quantidade movimentada
    quantidadeAnterior: { type: Number, required: true },
    quantidadeAtual: { type: Number, required: true },

    // Ex: "Compra a fornecedor", "Venda", "Perda/Dano", "Ajuste manual", "Estoque inicial"
    motivo: { type: String, trim: true },
    observacao: { type: String, trim: true },

    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilizador' },
  },
  { timestamps: true }
);

movimentoEstoqueSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Estoque', movimentoEstoqueSchema);