const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');
const verificarToken = require('../middleware/auth');

// Obtener todos los productos
router.get('/', verificarToken, async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json({ 
      success: true,
      productos 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener productos' 
    });
  }
});

// Crear nuevo producto
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, marca, categoria, existencias, precio, imagen } = req.body;
    
    const nuevoProducto = new Producto({
      nombre,
      marca,
      categoria,
      existencias,
      precio,
      imagen // Incluir la imagen
    });

    await nuevoProducto.save();
    res.status(201).json({
      success: true,
      producto: nuevoProducto
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al crear producto'
    });
  }
});

// Actualizar producto
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      producto: productoActualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar producto'
    });
  }
});

// Eliminar producto
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const productoEliminado = await Producto.findByIdAndDelete(id);

    if (!productoEliminado) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      mensaje: 'Producto eliminado correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar producto'
    });
  }
});

// Verificar si existe el nombre del producto
router.post('/check-name', verificarToken, async (req, res) => {
  try {
    const { nombre, excludeId } = req.body;
    
    const query = { nombre: nombre };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const productoExistente = await Producto.findOne(query);
    
    res.json({
      success: true,
      exists: !!productoExistente
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar el nombre del producto'
    });
  }
});
module.exports = router;