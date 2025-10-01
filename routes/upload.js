const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verificarToken = require('../middleware/auth');

// Configurar multer para el almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  console.log('Validando archivo en fileFilter:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  // Verificar si el archivo es una imagen
  if (file.mimetype.startsWith('image/')) {
    console.log(' Archivo aceptado como imagen');
    cb(null, true);
  } else {
    console.log(' Archivo rechazado, mimetype:', file.mimetype);
    cb(new Error('El archivo debe ser una imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: fileFilter
});

router.post('/', verificarToken, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Error de multer:', {
        message: err.message,
        code: err.code,
        field: err.field
      });
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'El archivo es demasiado grande',
          details: 'El tamaño máximo permitido es 5MB'
        });
      }
      
      return res.status(400).json({ 
        error: 'Error al procesar el archivo',
        details: err.message 
      });
    }
    
    try {
      if (!req.file) {
        console.log('No se recibió ningún archivo');
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }
      
      console.log('Archivo recibido:', req.file);
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      console.log('URL generada:', imageUrl);
      res.json({ url: imageUrl });
    } catch (error) {
      console.error('Error completo:', {
        message: error.message,
        stack: error.stack,
        details: error
      });
      res.status(500).json({ 
        error: 'Error al procesar la imagen',
        details: error.message 
      });
    }
  });
});

module.exports = router;