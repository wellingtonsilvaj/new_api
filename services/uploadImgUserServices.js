// Multer é um middleware node.js para manipulação multipart/form-data, usado para o upload de arquivos. 
const multer = require('multer');

// O módulo path permite interagir com o sistema de arquivos
const path = require('path');

// Realizar upload do usuário
module.exports = (multer({
    // diskStorage permite manipular local para salvar a imagem
    storage: multer.diskStorage({
        // Local para salvar a imagem
        destination: function (req, file, cb) {
            //console.log(file);
            cb(null, './public/images/users')
        },
        filename: function (req, file, cb) {
            // Criar novo nome para arquivo  
            cb(null, Date.now().toString() + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
        }
    }),
    // Validar a extensão do arquivo
    fileFilter: (req, file, cb) => {
        // Verificar se a extensão da imaggem enviada pelo usuário está no array de extensões
        const extensionImg = ['image/jpeg', 'image/jpg', 'image/png'].find((acceptedFormat) => acceptedFormat == file.mimetype);

        // Retornar TRUE quando a extensão da imagem é válida
        if (extensionImg) {
            return cb(null, true);
        } else {
            return cb(null, false);
        }
    }
}));