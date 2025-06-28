const express = require('express');
const router = express.Router();
const Venta = require('../models/venta');
const verificarToken = require('../middleware/auth');
const Carrito = require('../models/carrito');

// Registrar una venta (requiere autenticación)
router.post('/', verificarToken, async (req, res) => {
  try {
    const { productos, total, cedula, numeroReferencia, comprobantePago } = req.body;
    const usuarioId = req.usuario.id;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay productos en la venta' });
    }
    if (!cedula || !numeroReferencia) {
      return res.status(400).json({ success: false, error: 'Faltan datos de pago' });
    }

    const venta = new Venta({
      usuarioId,
      cedula,
      productos,
      total,
      numeroReferencia,
      comprobantePago
      // numeroVenta se asigna automáticamente en el modelo
    });

    await venta.save();
    // Descontar existencias de los productos vendidos
    for (const item of productos) {
      // item.productoId puede ser string o ObjectId, se fuerza a string
      const productoId = item.productoId?.toString() || item._id?.toString();
      const cantidadVendida = item.cantidad || 1;
      if (productoId) {
        await require('../models/producto').findByIdAndUpdate(
          productoId,
          { $inc: { existencias: -cantidadVendida } },
          { new: true }
        );
      }
    }
    // Eliminar el carrito del usuario después de la compra
    console.log('Intentando eliminar carrito para usuarioId:', usuarioId, 'tipo:', typeof usuarioId);
    const deleteResult = await Carrito.deleteOne({ usuarioId: String(usuarioId) });
    console.log('Resultado de deleteOne:', deleteResult);

    res.status(201).json({ success: true, venta });
  } catch (error) {
    console.error('❌ Error al registrar venta:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener todas las ventas (para admin)
router.get('/', verificarToken, async (req, res) => {
  try {
    const ventas = await Venta.find().populate('usuarioId', 'nombre correo');
    // Para que en el frontend puedas acceder como venta['usuario']['nombre']
    const ventasConUsuario = ventas.map(v => ({
      ...v.toObject(),
      usuario: v.usuarioId,
    }));
    res.json({ success: true, ventas: ventasConUsuario });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener ventas' });
  }
});

// Obtener ventas de un usuario
router.get('/usuario/:usuarioId', verificarToken, async (req, res) => {
  try {
    const ventas = await Venta.find({ usuarioId: req.params.usuarioId }).sort({ fecha: -1 });
    res.json({ success: true, ventas });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al obtener ventas' });
  }
});

// Verificar si un número de referencia ya existe
router.get('/referencia/:numeroReferencia', verificarToken, async (req, res) => {
  try {
    const { numeroReferencia } = req.params;
    const existe = await Venta.exists({ numeroReferencia });
    res.status(200).json({ exists: !!existe });
  } catch (error) {
    res.status(500).json({ exists: false, error: 'Error al verificar referencia' });
  }
});

module.exports = router;