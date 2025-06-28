const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  cedula: String,
  correo: String,
  nombre: String,
  telefono: String,
  contrasena: String,
  nivel: { type: Number, default: 1 },
});

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('contrasena')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', userSchema);

module.exports = Usuario;