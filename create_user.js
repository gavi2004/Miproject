const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('./models/usuario');

// USAR MONGODB ATLAS - CONEXIÓN DIRECTA A BODEGITA
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://reina:jema2019@cluster0.l4gwdvq.mongodb.net/bodegita?retryWrites=true&w=majority';

// Función para obtener entrada del usuario
function getUserInput() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        readline.question('Cédula: ', (cedula) => {
            readline.question('Correo: ', (correo) => {
                readline.question('Nombre: ', (nombre) => {
                    readline.question('Teléfono: ', (telefono) => {
                        readline.question('Contraseña: ', (contrasena) => {
                            readline.question('Nivel (1-3): ', (nivel) => {
                                readline.close();
                                resolve({
                                    cedula,
                                    correo,
                                    nombre,
                                    telefono,
                                    contrasena,
                                    nivel: parseInt(nivel) || 1
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

console.log('🔗 Conectando a MongoDB Atlas...');
console.log('Base de datos destino: bodegita');

async function createUser() {
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
        
        // Obtener datos del usuario
        console.log('\nPor favor ingrese los datos del nuevo usuario:');
        const userData = await getUserInput();
        
        // Verificar si el usuario ya existe
        const existingUser = await Usuario.findOne({ 
            $or: [
                { cedula: userData.cedula },
                { correo: userData.correo }
            ]
        });
        
        if (existingUser) {
            console.log('⚠️  Usuario ya existe en la base de datos bodegita');
            console.log('   🆔 Cédula:', existingUser.cedula);
            console.log('   📧 Email:', existingUser.correo);
            console.log('   👤 Nombre:', existingUser.nombre);
            
            // Preguntar si desea actualizar
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const shouldUpdate = await new Promise((resolve) => {
                readline.question('¿Desea actualizar este usuario? (s/n): ', (answer) => {
                    readline.close();
                    resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'si');
                });
            });
            
            if (!shouldUpdate) {
                console.log('❌ Operación cancelada');
                return;
            }
            
            // Crear el hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.contrasena, salt);
            
            // Actualizar el usuario existente
            await Usuario.updateOne(
                { _id: existingUser._id },
                {
                    nombre: userData.nombre,
                    telefono: userData.telefono,
                    contrasena: hashedPassword,
                    nivel: userData.nivel
                }
            );
            
            console.log('✅ Usuario actualizado exitosamente en MongoDB Atlas');
            console.log('   🆔 Cédula:', userData.cedula);
            console.log('   📧 Email:', userData.correo);
            console.log('   👤 Nombre:', userData.nombre);
            console.log('   📞 Teléfono:', userData.telefono);
            console.log('   🔢 Nivel:', userData.nivel);
        } else {
            // Crear el hash de la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.contrasena, salt);

            // Crear el nuevo usuario
            const newUser = new Usuario({
                cedula: userData.cedula,
                correo: userData.correo,
                nombre: userData.nombre,
                telefono: userData.telefono,
                contrasena: hashedPassword,
                nivel: userData.nivel
            });

            await newUser.save();
            console.log('✅ Usuario creado exitosamente en MongoDB Atlas');
            console.log('   🆔 Cédula:', userData.cedula);
            console.log('   📧 Email:', userData.correo);
            console.log('   👤 Nombre:', userData.nombre);
            console.log('   📞 Teléfono:', userData.telefono);
            console.log('   🔢 Nivel:', userData.nivel);
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
createUser();