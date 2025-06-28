const express = require('express');
const router = express.Router();
const Carrito = require('../models/carrito');

// Obtener el carrito de un usuario
router.get('/:usuarioId', async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ usuarioId: req.params.usuarioId });
    if (!carrito) {
      return res.json({ success: true, carrito: { usuarioId: req.params.usuarioId, productos: [] } });
    }
    res.json({ success: true, carrito });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Agregar producto al carrito
router.post('/add', async (req, res) => {
  const { usuarioId, producto } = req.body;
  try {
    let carrito = await Carrito.findOne({ usuarioId });
    if (!carrito) {
      carrito = new Carrito({ usuarioId, productos: [producto] });
      console.log(`🛒 Nuevo carrito creado para usuario: ${usuarioId}, producto agregado: ${producto.nombre}`);
    } else {
      const index = carrito.productos.findIndex(p => p.productoId === producto.productoId);
      if (index > -1) {
        carrito.productos[index].cantidad += producto.cantidad || 1;
        console.log(`🛒 Producto existente actualizado en carrito de ${usuarioId}: ${producto.nombre}, cantidad: ${carrito.productos[index].cantidad}`);
      } else {
        carrito.productos.push(producto);
        console.log(`🛒 Producto agregado al carrito de ${usuarioId}: ${producto.nombre}`);
      }
    }
    await carrito.save();
    res.json({ success: true, carrito });
  } catch (err) {
    console.error('❌ Error al agregar al carrito:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Eliminar producto del carrito
router.post('/remove', async (req, res) => {
  const { usuarioId, productoId } = req.body;
  try {
    const carrito = await Carrito.findOne({ usuarioId });
    if (carrito) {
      carrito.productos = carrito.productos.filter(p => p.productoId !== productoId);
      await carrito.save();
    }
    res.json({ success: true, carrito });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;