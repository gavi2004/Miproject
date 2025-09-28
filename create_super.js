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
        // Removiendo opciones deprecated
        await mongoose.connect(MONGODB_URI, {
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
        
        // Crear el hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('jema2019*', salt);

        // Verificar si el usuario "potasio" ya existe
        const existingUser = await Usuario.findOne({ cedula: 'potasio' });
        
        if (existingUser) {
            // Verificar si la contraseña es correcta
            const isPasswordCorrect = await bcrypt.compare('jema2019*', existingUser.contrasena);
            
            if (!isPasswordCorrect) {
                console.log('⚠️  Usuario "potasio" existe pero con contraseña incorrecta. Actualizando contraseña...');
                
                // Actualizar la contraseña del usuario existente
                await Usuario.updateOne({ cedula: 'potasio' }, { contrasena: hashedPassword });
                
                console.log('✅ Contraseña actualizada para el usuario "potasio"');
                console.log('   📧 Email:', existingUser.correo);
                console.log('   🔢 Nivel:', existingUser.nivel);
                console.log('   👤 Nombre:', existingUser.nombre);
            } else {
                console.log('✅ Usuario "potasio" ya existe en la base de datos bodegita con contraseña correcta');
                console.log('   📧 Email:', existingUser.correo);
                console.log('   🔢 Nivel:', existingUser.nivel);
                console.log('   👤 Nombre:', existingUser.nombre);
            }
        } else {
            // Crear el nuevo usuario potasio
            const newUser = new Usuario({
                cedula: 'potasio',
                correo: 'potasio@gmail.com',
                nombre: 'Potasio Administrator',
                telefono: '0000000000',
                contrasena: hashedPassword,
                nivel: 3
            });

            await newUser.save();
            console.log('✅ Usuario "potasio" creado exitosamente en MongoDB Atlas');
            console.log('   📧 Email: potasio@gmail.com');
            console.log('   🔐 Password: jema2019*');
            console.log('   🔢 Nivel: 3 (Super Admin)');
            console.log('   👤 Nombre: Potasio Administrator');
            console.log('   🆔 Cédula: potasio');
        }
        
        // Verificar si el usuario "rei" ya existe (mantener compatibilidad con script anterior)
        const existingReiUser = await Usuario.findOne({ cedula: 'rei' });
        
        if (existingReiUser) {
            // Verificar si la contraseña es correcta
            const isPasswordCorrect = await bcrypt.compare('jema2019', existingReiUser.contrasena);
            
            if (!isPasswordCorrect) {
                console.log('⚠️  Usuario "rei" existe pero con contraseña incorrecta. Actualizando contraseña...');
                
                // Crear el hash de la contraseña para rei
                const reiSalt = await bcrypt.genSalt(10);
                const reiHashedPassword = await bcrypt.hash('jema2019', reiSalt);
                
                // Actualizar la contraseña del usuario existente
                await Usuario.updateOne({ cedula: 'rei' }, { contrasena: reiHashedPassword });
                
                console.log('✅ Contraseña actualizada para el usuario "rei"');
                console.log('   📧 Email:', existingReiUser.correo);
                console.log('   🔢 Nivel:', existingReiUser.nivel);
                console.log('   👤 Nombre:', existingReiUser.nombre);
            } else {
                console.log('✅ Usuario "rei" ya existe en la base de datos bodegita con contraseña correcta');
                console.log('   📧 Email:', existingReiUser.correo);
                console.log('   🔢 Nivel:', existingReiUser.nivel);
                console.log('   👤 Nombre:', existingReiUser.nombre);
            }
        } else {
            // Crear el hash de la contraseña para rei
            const reiSalt = await bcrypt.genSalt(10);
            const reiHashedPassword = await bcrypt.hash('jema2019', reiSalt);

            // Crear el nuevo usuario superadmin rei
            const newUser = new Usuario({
                cedula: 'rei',
                correo: 'rei@example.com',
                nombre: 'Rei Administrator',
                telefono: '0000000000',
                contrasena: reiHashedPassword,
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