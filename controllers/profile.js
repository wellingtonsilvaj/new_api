// Incluir as bibliotecas
// Gerencia as requisições, rotas e URLs, entre outra funcionalidades
const express = require('express');
// Chamar a função express
const router = express.Router();
// Criptografar senha
const bcrypt = require('bcryptjs');
// Validar input do formulário
const yup = require('yup');
// Operador do sequelize 
const { Op } = require("sequelize");
// Incluir a conexão com BD
const db = require("../db/models");
// Incluir o arquivo para validar o token
const { eAdmin } = require('../services/authService');
// Incluir o arquivo com a função de upload
const upload = require('../services/uploadImgUserServices');
// O módulo fs permite interagir com o sistema de arquivos
const fs = require('fs');
// Incluir o arquivo responsável em salvar os logs
const logger = require('../services/loggerServices');

// Criar a rota visualizar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/profile
router.get("/profile", eAdmin, async (req, res) => {

    // Recuperar o registro do BD
    const user = await db.Users.findOne({

        // Indicar quais colunas recuperar
        attributes: ['id', 'name', 'email', 'situationId', 'image', 'createdAt', 'updatedAt'],

        // Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: { id: req.userId },

        // Buscar dados na tabela secundária
        include: [{
            model: db.Situations,
            attributes: ['nameSituation']
        }]
    });

    // Acessa o IF se encontrar o registro no BD
    if (user) {

        // Salvar o log no nível info
        logger.info({ message: "Perfil visualizado.", id: req.userId, userId: req.userId, date: new Date() });

        // Acessa o IF quando o usuário possui a imagem
        if (user.dataValues.image) {
            // console.log(user.dataValues.image);
            // Criar o caminho da imagem
            user.dataValues['image'] = process.env.URL_ADM + "/images/users/" + user.dataValues.image;
        } else {
            // Criar o caminho da imagem
            user.dataValues['image'] = process.env.URL_ADM + "/images/users/icon_user.png";
        }

        // Retornar objeto como resposta
        return res.json({
            error: false,
            user
        });
    } else {

        // Salvar o log no nível info
        logger.info({ message: "Perfil não encontrado.", id: req.userId, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Perfil não encontrado!"
        });
    }

});

// Criar a rota editar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/profile
// A aplicação externa deve indicar que está enviado os dados em formato de objeto Content-Type: application/json
// Dados em formato de objeto
/*{
    "name": "Cesar",
    "email": "cesar@celke.com.br"
}
*/
router.put("/profile", eAdmin, async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    const data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        email: yup.string("Erro: Necessário preencher o campo e-mail!")
            .required("Erro: Necessário preencher o campo e-mail!")
            .email("Erro: Necessário preencher e-mail válido!"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
            .required("Erro: Necessário preencher o campo nome!"),
    });

    // Verificar se todos os campos passaram pela validação
    try {
        await schema.validate(data);
    } catch (error) {
        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: error.errors
        });
    }

    // Recuperar o registro do BD
    const user = await db.Users.findOne({

        // Indicar quais colunas recuperar
        attributes: ['id'],

        // Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: {
            email: data.email,
            id: {
                // Operador de de negação para ignorar o registro do usuário que está sendo editado
                [Op.ne]: Number(req.userId)
            }
        }

    });

    // Acessa o IF se encontrar o registro no BD
    if (user) {

        // Salvar o log no nível info
        logger.info({ message: "Tentativa de usar e-mail já cadastrado em outro usuário.", id: req.userId, name: data.name, email: data.email, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Este e-mail já está cadastrado!"
        });
    }

    // Editar no BD
    await db.Users.update(data, { where: { id: req.userId } })
        .then(() => {

            // Salvar o log no nível info
            logger.info({ message: "Perfil editado com sucesso.", id: req.userId, name: data.name, email: data.email, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Perfil editado com sucesso!"
            });
        }).catch(() => {

            // Salvar o log no nível info
            logger.info({ message: "Perfil não editado.", id: req.userId, name: data.name, email: data.email, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Perfil não editado!"
            });
        });

});

//Criar rota editar senha
router.put("/profile-password", eAdmin, async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    const data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        password: yup.string("Erro: Necessário preencher o campo senha!")
            .required("Erro: Necessário preencher o campo senha!")
            .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!")
    });

    // Verificar se todos os campos passaram pela validação
    try {
        await schema.validate(data);
    } catch (error) {
        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: error.errors
        });
    }

    // Criptografar a senha
    data.password = await bcrypt.hash(String(data.password), 8);

    // Editar no BD
    await db.Users.update(data, { where: { id: req.userId } })
        .then(() => {

            // Salvar o log no nível info
            logger.info({ message: "Senha do perfil editado com sucesso.", id: req.userId, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Senha do perfil editado com sucesso!"
            });
        }).catch(() => {

            // Salvar o log no nível info
            logger.info({ message: "Senha do perfil não editado.", id: req.userId, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Senha do perfil não editado!"
            });
        });

});

// Criar a rota editar imagem e receber o parâmentro 
// Endereço para acessar através da aplicação externa: http://localhost:8080/profile-image
router.put("/profile-image", eAdmin, upload.single('image'), async (req, res) => {


    // Acessa o IF quando a extensão da imagem é inválida
    //console.log(req.file);
    if (!req.file) {

        // Salvar o log no nível info
        logger.info({ message: "Enviado extensão da imagem inválida no editar imagem do usuário.", userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Selecione uma imagem válida JPEG ou PNG!"
        });
    }

    // Recuperar o registro do BD
    const user = await db.Users.findOne({

        // Indicar quais colunas recuperar
        attributes: ['id', 'image'],

        // Acrescentar condição para indicar qual registro deve ser retornado do BD
        where: { id: req.userId }

    });

    // Verificar se o usuário tem imagem salva no BD
    //console.log(user);
    if (user.dataValues.image) {

        // Criar o caminho da imagem que o usuário tem no BD
        var imgOld = "./public/images/users/" + user.dataValues.image;

        // fs.access usado para testar as permissões do arquivo
        fs.access(imgOld, (error) => {

            // Acessa o IF quando não tiver nenhum erro
            if (!error) {

                // Apagar a imagem antiga
                fs.unlink(imgOld, () => {
                    // Salvar o log no nível info
                    logger.info({ message: "Excluida a imagem do usuário.", id: req.userId, image: user.dataValues.image, userId: req.userId, date: new Date() });
                });
            }
        });
    }

    // Editar no BD
    db.Users.update(
        { image: req.file.filename },
        { where: { id: req.userId } })
        .then(() => {

            // Salvar o log no nível info
            logger.info({ message: "Imagem do perfil editado com sucesso.", image: req.file.filename, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Imagem editada com sucesso!"
            });
        }).catch(() => {

            // Salvar o log no nível info
            logger.info({ message: "Imagem do perfil não editado.", image: req.file.filename, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Imagem não editada!"
            });
        });
});


// Exportar a instrução que está dentro da constante router 
module.exports = router;