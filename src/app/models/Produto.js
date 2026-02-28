import mongoose from 'mongoose';

const produtoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome do produto/serviço é obrigatório'],
    trim: true,
  },
  codigo: {
    type: String,
    trim: true,
    uppercase: true,
  },
  descricao: String,
  precoUnitario: {
    type: Number,
    required: [true, 'Preço unitário é obrigatório'],
    min: 0,
  },
  unidade: {
    type: String,
    enum: ['un', 'kg', 'm', 'hora', 'dia', 'servico', 'outro'],
    default: 'un',
  },
  categoria: String,
  tributavel: {
    type: Boolean,
    default: true,
  },
  ativo: {
    type: Boolean,
    default: true,
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Produto', produtoSchema);