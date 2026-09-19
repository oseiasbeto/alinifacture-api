const mongoose = require("mongoose");

const utilizadorSchema = new mongoose.Schema({
  nomeProprio: {
    type: String,
    required: [true, 'Nome próprio é obrigatório'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  palavraPasse: {
    type: String,
    required: [true, 'Palavra-passe é obrigatória'],
    minlength: 8,
    select: false,
  },
  cargo: {
    type: String,
    enum: ['gerente', 'caixa', 'administrador', 'visualizador'],
    default: 'gerente',
  },
  telefone: String,
  ultimoLogin: Date,
  ativo: {
    type: Boolean,
    default: true,
  },
  fotoPerfil: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('Utilizador', utilizadorSchema);