const jwt = require('jsonwebtoken');
const JWT_SECRET = 'mi_clave_secreta';

// Middleware para proteger rutas
const verificarToken = (req, res, next) => {
    const token = req.header('x-auth-token'); // Espera que el token esté en el encabezado de la solicitud

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    try {
        // Verificar el token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; // Agregar la información del usuario al request
        next(); // Continuar con la solicitud
    } catch (error) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

module.exports = verificarToken;
