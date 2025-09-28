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

app.use('/users', usersRouter);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conexion Exitosa a Atlas MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Obtener IP
function obtenerIP(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
}

// Ruta de prueba
app.get('/ping', (req, res) => {
  const ip = obtenerIP(req);
  console.log(`📶 Nueva Conexion Desde: ${ip}`);
  res.json({ message: 'Conectado al backend', ip });
});

// Verificar si la cédula ya existe
app.get('/users/cedula/:cedula', async (req, res) => {
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

// Registrar usuario
app.post('/users', async (req, res) => {
  const { cedula, correo, nombre, telefono, contrasena, nivel } = req.body;

  if (!cedula || !correo || !nombre || !telefono || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const cedulaExistente = await Usuario.findOne({ cedula });
    if (cedulaExistente) {
      return res.status(409).json({ error: 'La cédula ya está registrada' });
    }

    const correoExistente = await Usuario.findOne({ correo });
    if (correoExistente) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const telefonoExistente = await Usuario.findOne({ telefono });
    if (telefonoExistente) {
      return res.status(409).json({ error: 'El teléfono ya está registrado' });
    }

    const nuevoUsuario = new Usuario({
      cedula, correo, nombre, telefono, contrasena, nivel
    });

    await nuevoUsuario.save();
    console.log('✅ Usuario guardado:', nuevoUsuario);
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Usar el loginRouter para las rutas de login
app.use('/login', loginRouter);

// Ruta protegida
app.get('/ruta-protegida', verificarToken, (req, res) => {
    res.json({ message: 'Acceso permitido', usuario: req.usuario });
});

// Agregar esta línea junto a las demás rutas
app.use('/products', productsRouter);

app.use('/carrito', carritoRoutes);

app.use('/ventas', ventasRouter);

// Configurar el servicio de archivos estáticos para las imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Agregar la ruta de upload
app.use('/upload', uploadRouter);

// INICIAR SERVIDOR HTTP SIMPLE (SIN HTTPS)
app.listen(PORT, '0.0.0.0', function() {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('¡Backend de Bodegita funcionando!');
});