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



// Exportar a instrução que está dentro da constante router 
module.exports = router;