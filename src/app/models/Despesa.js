// models/Despesa.js
const mongoose = require('mongoose');

const despesaSchema = new mongoose.Schema({
    descricao: { type: String, required: true, trim: true },
    categoria: {
        type: String,
        enum: ['compra_estoque', 'saida_estoque', 'salario', 'renda', 'energia', 'agua', 'transporte', 'manutencao', 'outros'],
        default: 'outros'
    },
    valor: { type: Number, required: true, min: 0 },
    data: { type: Date, default: Date.now },

    // Ligação opcional ao produto / movimento de estoque que originou a despesa
    produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
    movimentoEstoque: { type: mongoose.Schema.Types.ObjectId, ref: 'Estoque' },
    quantidade: { type: Number },
    custoUnitario: { type: Number },

    fornecedor: { type: String, trim: true },
    formaPagamento: {
        type: String,
        enum: ['dinheiro', 'transferencia', 'multicaixa', 'cheque', 'outro'],
        default: 'dinheiro',
    },
    observacao: { type: String, trim: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

despesaSchema.index({ data: -1 });
despesaSchema.index({ categoria: 1 });

module.exports = mongoose.model('Despesa', despesaSchema);