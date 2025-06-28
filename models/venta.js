const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  cedula: { type: String, required: true },
  productos: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
      nombre: String,
      cantidad: Number,
      precio: Number
    }
  ],
  total: { type: Number, required: true },
  numeroReferencia: { type: String, required: true },
  comprobantePago: { type: String }, // URL o nombre de archivo de la imagen
  fecha: { type: Date, default: Date.now },
  numeroVenta: { type: Number, required: true, unique: true } // Nuevo campo autoincremental
});

// Middleware para autoincrementar numeroVenta
ventaSchema.pre('validate', async function(next) {
  if (this.isNew) {
    const lastVenta = await this.constructor.findOne({}, {}, { sort: { numeroVenta: -1 } });
    this.numeroVenta = lastVenta && lastVenta.numeroVenta ? lastVenta.numeroVenta + 1 : 1;
  }
  next();
});

const Venta = mongoose.models.Venta || mongoose.model('Venta', ventaSchema);

module.exports = Venta;