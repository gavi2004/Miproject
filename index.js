const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Usuario = require('./models/usuario');
const loginRouter = require('./login');
const verificarToken = require('./middleware/auth');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const uploadRouter = require('./routes/upload');
const carritoRoutes = require('./routes/carrito');
const ventasRouter = require('./routes/ventas');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar el servicio de archivos estáticos para las imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CONEXIÓN A MONGODB ATLAS - BASE DE DATOS BODEGITA
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reina:jema2019@cluster0.l4gwdvq.mongodb.net/bodegita?retryWrites=true&w=majority';

console.log('🚀 Iniciando servidor Bodegita...');
console.log('🔗 Conectando a MongoDB Atlas - Base: bodegita');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ Conexión exitosa a MongoDB Atlas');
})
.catch(err => {
    console.error('❌ Error conectando a MongoDB Atlas:', err.message);
    process.exit(1);
});

// Obtener IP del cliente
function obtenerIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// ========== RUTAS BÁSICAS ==========

// Ruta de prueba
app.get('/ping', (req, res) => {
    const ip = obtenerIP(req);
    const dbStatus = mongoose.connection.readyState === 1 ? 'Conectada' : 'Desconectada';
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'No disponible';
    
    console.log(`📶 Ping recibido desde: ${ip} | DB: ${dbStatus} | Base: ${dbName}`);
    
    res.json({ 
        message: 'Backend de Bodegita funcionando correctamente',
        ip: ip,
        database: {
            status: dbStatus,
            name: dbName,
            connected: mongoose.connection.readyState === 1
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Ruta de salud
app.get('/health', (req, res) => {
    const dbHealthy = mongoose.connection.readyState === 1;
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Ruta principal
app.get('/', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada';
    res.send(`
        <html>
            <head>
                <title>Bodegita Backend</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .connected { background: #d4edda; color: #155724; }
                    .disconnected { background: #f8d7da; color: #721c24; }
                </style>
            </head>
            <body>
                <h1>🚀 Backend de Bodegita</h1>
                <div class="status ${dbStatus === 'conectada' ? 'connected' : 'disconnected'}">
                    📊 Base de datos: ${dbStatus}
                </div>
                <p>✅ Servidor funcionando correctamente</p>
                <p><a href="/ping">Probar conexión</a></p>
                <p><a href="/health">Estado de salud</a></p>
                <p><a href="/users">Gestión de usuarios</a></p>
                <p><a href="/products">Productos</a></p>
                <p><a href="/carrito">Carrito</a></p>
                <p><a href="/ventas">Ventas</a></p>
            </body>
        </html>
    `);
});

// ========== REGISTRO DE TODAS LAS RUTAS (EN ORDEN CORRECTO) ==========

// Ruta de login
app.use('/login', loginRouter);

// Ruta de usuarios (ELIMINA las rutas duplicadas de /users que tenías antes)
app.use('/users', usersRouter);

// Ruta de productos
app.use('/products', productsRouter);

// Ruta de carrito
app.use('/carrito', carritoRoutes);

// Ruta de ventas
app.use('/ventas', ventasRouter);

// Ruta de upload
app.use('/upload', uploadRouter);

// Ruta protegida
app.get('/ruta-protegida', verificarToken, (req, res) => {
    res.json({ 
        message: 'Acceso permitido', 
        usuario: req.usuario,
        timestamp: new Date().toISOString()
    });
});

// ========== MANEJO DE ERRORES (AL FINAL) ==========

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error global:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Ruta 404 - DEBE SER LA ÚLTIMA
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', function() {
    console.log(`🚀 Servidor Bodegita corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
    console.log(`📊 Base de datos: bodegita`);
    console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
    console.log(`📋 Rutas disponibles:`);
    console.log(`   - GET  /`);
    console.log(`   - GET  /ping`);
    console.log(`   - GET  /health`);
    console.log(`   - POST /login`);
    console.log(`   - GET  /users`);
    console.log(`   - GET  /products`);
    console.log(`   - GET  /carrito`);
    console.log(`   - GET  /ventas`);
    console.log(`   - POST /upload`);
    console.log(`   - GET  /ruta-protegida`);
});

// Manejo graceful de shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Recibida señal de interrupción, cerrando servidor...');
    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB cerrada');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Recibida señal de terminación, cerrando servidor...');
    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB cerrada');
    process.exit(0);
});