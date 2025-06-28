const mongoose = require('mongoose');

const CarritoSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true },
  productos: [
    {
      productoId: { type: String, required: true },
      nombre: String,
      precio: Number,
      cantidad: { type: Number, default: 1 },
      imagen: String,
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Carrito', CarritoSchema);