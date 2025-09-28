const express = require('express');
const router = express.Router();
const Usuario = require('./models/usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mi_clave_secreta';

router.post('/', async (req, res) => {
    const { correo, contrasena } = req.body;

    console.log('🔍 LOGIN DEBUG:');
    console.log('   - Correo:', correo);
    console.log('   - Contraseña recibida:', contrasena);

    if (!correo || !contrasena) {
        return res.status(400).json({
            success: false,
            error: 'Correo y contraseña son requeridos'
        });
    }

    try {
        // Buscar usuario por correo
        const usuario = await Usuario.findOne({ correo });
        console.log('   - Usuario encontrado:', usuario ? 'Sí' : 'No');
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Debug información del usuario
        console.log('   - Hash en BD:', usuario.contrasena);
        console.log('   - Longitud hash:', usuario.contrasena?.length);
        console.log('   - Usuario ID:', usuario._id);
        console.log('   - Nombre:', usuario.nombre);

        // Verificar contraseña
        const contrasenaCorrecta = await bcrypt.compare(contrasena, usuario.contrasena);
        console.log('   - bcrypt.compare resultado:', contrasenaCorrecta);
        
        if (!contrasenaCorrecta) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }

        // Crear token JWT
        const token = jwt.sign(
            { 
                id: usuario._id, 
                nombre: usuario.nombre, 
                correo: usuario.correo,
                nivel: usuario.nivel 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Preparar respuesta sin contraseña
        const usuarioResponse = {
            _id: usuario._id,
            cedula: usuario.cedula,
            correo: usuario.correo,
            nombre: usuario.nombre,
            telefono: usuario.telefono,
            nivel: usuario.nivel
        };

        console.log('✅ Login exitoso para:', usuario.correo);

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            usuario: usuarioResponse,
            token: token
        });

    } catch (error) {
        console.error('❌ Error al iniciar sesión:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;