const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('./models/usuario');

// USAR MONGODB ATLAS - MODIFICADO
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI no está definida');
  console.log('💡 Ejecuta este script en el entorno de Coolify o define MONGODB_URI');
  process.exit(1);
}

console.log('🔗 Conectando a MongoDB Atlas...');

async function createSuperAdmin() {
    try {
        // Conectar a MongoDB Atlas
        await mongoose.connect(MONGODB_URI);
        
        console.log('✅ Conectado a MongoDB Atlas exitosamente');
        
        // Verificar la base de datos
        const db = mongoose.connection.db;
        console.log('📊 Base de datos:', db.databaseName);
        
        // Verificar si el usuario "rei" ya existe
        const existingUser = await Usuario.findOne({ cedula: 'rei' });
        
        if (existingUser) {
            console.log('✅ Usuario "rei" ya existe');
            console.log('   Email:', existingUser.correo);
            console.log('   Nivel:', existingUser.nivel);
        } else {
            // Crear el hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('jema2019', salt);

            // Crear el nuevo usuario superadmin
            const newUser = new Usuario({
                cedula: 'rei',
                correo: 'rei@example.com',
                nombre: 'Rei Administrator',
                telefono: '0000000000',
                contrasena: hashedPassword,
                nivel: 3
            });

            await newUser.save();
            console.log('✅ Super usuario "rei" creado exitosamente en MongoDB Atlas');
            console.log('   Email: rei@example.com');
            console.log('   Password: jema2019');
            console.log('   Nivel: 3 (Super Admin)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('💡 Verifica:');
        console.log('   1. Que MONGODB_URI esté correctamente configurada');
        console.log('   2. Que tu IP esté en la whitelist de MongoDB Atlas');
        console.log('   3. Que las credenciales sean correctas');
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔒 Conexión cerrada');
        }
        process.exit(0);
    }
}

createSuperAdmin();