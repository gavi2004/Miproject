const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('./models/usuario');

// USAR MONGODB ATLAS - CONEXIÓN DIRECTA A BODEGITA
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reina:jema2019@cluster0.l4gwdvq.mongodb.net/bodegita?retryWrites=true&w=majority';

console.log('🔗 Conectando a MongoDB Atlas...');
console.log('Base de datos destino: bodegita');

async function createSuperAdmin() {
    try {
        // Conectar a MongoDB Atlas específicamente a la base de datos bodegita
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000
        });
        
        console.log('✅ Conectado a MongoDB Atlas exitosamente');
        
        // Verificar la base de datos actual
        const db = mongoose.connection.db;
        console.log('📊 Base de datos conectada:', db.databaseName);
        
        // Verificar colecciones existentes
        const collections = await db.listCollections().toArray();
        console.log('📂 Colecciones en la base de datos:');
        collections.forEach(collection => {
            console.log('   -', collection.name);
        });
        
        // Verificar si el usuario "rei" ya existe
        const existingUser = await Usuario.findOne({ cedula: 'rei' });
        
        if (existingUser) {
            console.log('✅ Usuario "rei" ya existe en la base de datos bodegita');
            console.log('   📧 Email:', existingUser.correo);
            console.log('   🔢 Nivel:', existingUser.nivel);
            console.log('   👤 Nombre:', existingUser.nombre);
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
            console.log('   📧 Email: rei@example.com');
            console.log('   🔐 Password: jema2019');
            console.log('   🔢 Nivel: 3 (Super Admin)');
            console.log('   👤 Nombre: Rei Administrator');
            console.log('   🆔 Cédula: rei');
        }
        
    } catch (error) {
        console.error('❌ Error al conectar o crear usuario:', error.message);
        console.log('🔍 Detalles del error:');
        console.log('   - Tipo:', error.name);
        console.log('   - Código:', error.code);
        
        if (error.name === 'MongoServerError') {
            console.log('💡 Solución: Verifica las credenciales de MongoDB Atlas');
        } else if (error.name === 'MongooseServerSelectionError') {
            console.log('💡 Solución: Verifica la conexión a internet y la URL de MongoDB Atlas');
        } else if (error.name === 'MongooseError') {
            console.log('💡 Solución: Verifica la configuración de Mongoose');
        }
        
        console.log('🌐 URL utilizada:', MONGODB_URI.replace(/jema2019/, '***'));
        
    } finally {
        // Cerrar la conexión siempre
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔒 Conexión a MongoDB cerrada');
        }
        process.exit(0);
    }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('🛑 Recibida señal de interrupción, cerrando conexión...');
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    process.exit(0);
});

// Ejecutar la función principal
createSuperAdmin();