const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const verificarToken = require('../middleware/auth');

// Crear un nuevo usuario (sin autenticación requerida)
router.post('/', async (req, res) => {
  const { cedula, correo, nombre, telefono, contrasena, nivel } = req.body;

  console.log('🔍 CREAR USUARIO DEBUG:');
  console.log('   - Contraseña recibida:', contrasena);

  if (!cedula || !correo || !nombre || !telefono || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar si la cédula ya existe
    const cedulaExistente = await Usuario.findOne({ cedula });
    if (cedulaExistente) {
      return res.status(409).json({ error: 'La cédula ya está registrada' });
    }

    // Verificar si el correo ya existe
    const correoExistente = await Usuario.findOne({ correo });
    if (correoExistente) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Verificar si el teléfono ya existe
    const telefonoExistente = await Usuario.findOne({ telefono });
    if (telefonoExistente) {
      return res.status(409).json({ error: 'El teléfono ya está registrado' });
    }

    // ✅ SOLO crear usuario - el middleware se encarga del hash
    const nuevoUsuario = new Usuario({
      cedula,
      correo,
      nombre,
      telefono,
      contrasena, // ← Se pasa en texto plano
      nivel: nivel || 1
    });

    await nuevoUsuario.save();
    console.log('✅ Usuario guardado con hash automático');

    // Excluir la contraseña del objeto que se devuelve
    const usuarioResponse = nuevoUsuario.toObject();
    delete usuarioResponse.contrasena;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      usuario: usuarioResponse
    });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar si la cédula ya existe (sin autenticación requerida)
router.get('/cedula/:cedula', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ cedula: req.params.cedula });
    if (usuario) {
      return res.status(200).json({ existe: true });
    } else {
      return res.status(404).json({ existe: false });
    }
  } catch (err) {
    console.error('❌ Error al verificar cédula:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los usuarios (requiere autenticación)
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

// Obtener usuario por ID (requiere autenticación)
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

// Actualizar usuario por ID (requiere autenticación)
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

// Eliminar usuario por ID (requiere autenticación)
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

module.exports = router;