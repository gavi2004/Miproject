const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('./models/usuario');

// Probar SIN autenticación primero
const MONGODB_URI = 'mongodb://localhost:27030/miproject';

console.log('🔗 Conectando a MongoDB sin autenticación...');

async function createSuperAdmin() {
    try {
        // Conectar SIN opciones deprecated
        await mongoose.connect(MONGODB_URI);
        
        console.log('✅ Conectado a MongoDB exitosamente');
        
        // Verificar si podemos crear la base de datos
        const db = mongoose.connection.db;
        console.log('📊 Base de datos actual:', db.databaseName);
        
        // Verificar si el usuario "rei" ya existe
        const existingUser = await Usuario.findOne({ cedula: 'rei' });
        
        if (existingUser) {
            console.log('✅ Usuario "rei" ya existe');
            console.log('   Email:', existingUser.correo);
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
            console.log('✅ Super usuario "rei" creado exitosamente');
            console.log('   Email: rei@example.com');
            console.log('   Password: jema2019');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Si falla sin auth, probar con auth pero con diferentes credenciales
        console.log('\n🔑 Probando con autenticación alternativa...');
        
        const authURIs = [
            'mongodb://root:example@localhost:27030/admin',
            'mongodb://admin:admin@localhost:27030/miproject',
            'mongodb://localhost:27030/admin'
        ];
        
        for (const uri of authURIs) {
            try {
                await mongoose.connect(uri);
                console.log(`✅ Conectado con: ${uri}`);
                // Intentar crear el usuario aquí...
                break;
            } catch (authError) {
                console.log(`❌ Falló: ${uri}`);
            }
        }
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('🔒 Conexión cerrada');
        }
    }
}

createSuperAdmin();