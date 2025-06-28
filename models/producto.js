const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  marca: {
    type: String,
    required: [true, 'La marca es obligatoria'],
    trim: true
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true
  },
  existencias: {
    type: Number,
    required: [true, 'Las existencias son obligatorias'],
    min: [0, 'Las existencias no pueden ser negativas'],
    default: 0
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  imagen: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar la fecha de modificación
productoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Producto = mongoose.models.Producto || mongoose.model('Producto', productoSchema);

module.exports = Producto;