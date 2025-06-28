const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario'); // Asegúrate de que la ruta sea correcta
const verificarToken = require('../middleware/auth'); // Importar el middleware de autenticación

// Eliminar '/users' de aquí ya que ahora está en el prefijo
// Cambiar esto


// Por esto
router.get('/', verificarToken, async (req, res) => {
  try {
    const users = await Usuario.find().select('-contrasena -__v');
    res.json({ 
      success: true,
      users 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener usuarios' 
    });
  }
});

// Obtener usuario por ID
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id).select('-contrasena -__v');
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    res.json({
      success: true,
      usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario'
    });
  }
});

// Cambiar de '/users/:id' a '/:id'
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, telefono, nivel } = req.body;
    
    console.log('ID:', id);
    console.log('Datos recibidos:', req.body);
    
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { nombre, correo, telefono, nivel },
      { new: true }
    ).select('-contrasena -__v');

    if (!usuarioActualizado) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario'
    });
  }
});


// ... existing code ...

router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuarioEliminado = await Usuario.findByIdAndDelete(id);

    if (!usuarioEliminado) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      mensaje: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
});

// ... existing code ...

module.exports = router;