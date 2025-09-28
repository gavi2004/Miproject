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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar el servicio de archivos estáticos para las imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CONEXIÓN A MONGODB ATLAS - BASE DE DATOS BODEGITA
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reina:jema2019@cluster0.l4gwdvq.mongodb.net/bodegita?retryWrites=true&w=majority';

console.log('🚀 Iniciando servidor Bodegita...');
console.log('🔗 Conectando a MongoDB Atlas - Base: bodegita');

// Configuración de conexión mejorada
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1
})
.then(() => {
    console.log('✅ Conexión exitosa a MongoDB Atlas');
    console.log('📊 Base de datos: bodegita');
    console.log('⏰ Hora de conexión:', new Date().toLocaleString());
})
.catch(err => {
    console.error('❌ Error crítico conectando a MongoDB Atlas:', err.message);
    console.log('🔍 Detalles del error:', {
        name: err.name,
        code: err.code,
        stack: err.stack
    });
    console.log('💡 Soluciones posibles:');
    console.log('   1. Verificar la URL de MongoDB Atlas');
    console.log('   2. Verificar que la base de datos "bodegita" exista');
    console.log('   3. Verificar las credenciales de usuario');
    console.log('   4. Verificar la whitelist de IPs en MongoDB Atlas');
    process.exit(1);
});

// Eventos de conexión para monitoreo
mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose conectado a MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Error de conexión Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose desconectado de MongoDB Atlas');
});

// Obtener IP del cliente
function obtenerIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Ruta de prueba mejorada
app.get('/ping', (req, res) => {
    const ip = obtenerIP(req);
    const dbStatus = mongoose.connection.readyState === 1 ? 'Conectada' : 'Desconectada';
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'No disponible';
    
    console.log(`.debugLine Ping recibido desde: ${ip} | DB: ${dbStatus} | Base: ${dbName}`);
    
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

// Ruta de salud para load balancers
app.get('/health', (req, res) => {
    const dbHealthy = mongoose.connection.readyState === 1;
    const status = dbHealthy ? 200 : 503;
    
    res.status(status).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Registrar rutas
app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/products', productsRouter);
app.use('/carrito', carritoRoutes);
app.use('/ventas', ventasRouter);
app.use('/upload', uploadRouter);

// Ruta protegida
app.get('/ruta-protegida', verificarToken, (req, res) => {
    res.json({ 
        message: 'Acceso permitido', 
        usuario: req.usuario,
        database: mongoose.connection.db.databaseName
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
            </body>
        </html>
    `);
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error global:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message 
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.originalUrl 
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', function() {
    console.log(`🚀 Servidor Bodegita corriendo en puerto ${PORT}`);
    console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
    console.log(`📊 Base de datos: bodegita`);
    console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);
});

// Manejo graceful de shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Recibida señal de interrupción, cerrando servidor...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Recibida señal de terminación, cerrando servidor...');
    await mongoose.connection.close();
    process.exit(0);
});