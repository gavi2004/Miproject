const express = require('express');
const router = express.Router();
const Usuario = require('./models/usuario');
const bcrypt = require('bcryptjs');  // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar el JWT

const JWT_SECRET = 'mi_clave_secreta'; // Clave secreta para JWT

router.post('/', async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({
            success: false,
            error: 'Correo y contraseña son requeridos'
        });
    }

    try {
        const usuario = await Usuario.findOne({ correo });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Comparar la contraseña encriptada usando bcrypt
        const contrasenaCorrecta = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaCorrecta) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }

        // Excluir la contraseña en la respuesta
        const usuarioSinPassword = usuario.toObject();
        delete usuarioSinPassword.contrasena;

        // Crear un JWT
        const token = jwt.sign(
            { id: usuario._id, nombre: usuario.nombre, nivel: usuario.nivel },
            JWT_SECRET,
            { expiresIn: '1h' } // El token expirará en 1 hora
        );

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            usuario: usuarioSinPassword,
            token: token // Devolvemos el JWT
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
