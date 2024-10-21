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

// Criar a rota listar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/users?page=1
router.get("/users", eAdmin, async (req, res) => {

    // Receber o número da página, quando não é enviado o número da página é atribuido página 1
    const { page = 1 } = req.query;
    //console.log(page);



    // Limite de registros em cada página
    const limit = 4;

    // Variável com o número da última página
    var lastPage = 1;

    // Contar a quantidade de registro no BD
    const countUser = await db.Users.count();

    // Acessa o IF quando encontrar registro no BD
    if (countUser !== 0) {

        // Calcular a última página
        lastPage = Math.ceil(countUser / limit);
        //console.log(lastPage);
    } else {
        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Nenhum usuário encontrado!"
        });
    }

    //console.log((page * limit) - limit); // 2 * 2 = 4
    // Recuperar todos os usuário do BD
    const users = await db.Users.findAll({

        // Indicar quais colunas recuperar
        attributes: ['id', 'name', 'email', 'situationId'],

        // Ordenar os registros pela coluna id na forma decrescente
        order: [['id', 'DESC']],

        // Buscar dados na tabela secundária
        include: [{
            model: db.Situations,
            attributes: ['nameSituation']
        }],

        // Calcular a partir de qual registro deve retornar e o limite de registros
        offset: Number((page * limit) - limit),
        limit: limit
    });

    // Acessa o IF se encontrar o registro no BD
    if (users) {

        // Salvar o log no nível info
        logger.info({ message: "Listar usuários.", userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            users,
            lastPage,
            countUser
        });
    } else {

        // Salvar o log no nível info
        logger.info({ message: "Listar usuário não executado corretamente.", userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Nenhum usuário encontrado!"
        });
    }
});

// Criar a rota visualizar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/users/7
router.get("/users/:id", eAdmin, async (req, res) => {

    // Receber o parâmetro enviado na URL
    // http://localhost:8080/users/7
    const { id } = req.params;

    // Recuperar o registro do BD
    const user = await db.Users.findOne({

        // Indicar quais colunas recuperar
        attributes: ['id', 'name', 'email', 'situationId', 'image', 'createdAt', 'updatedAt'],

        // Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: { id },

        // Buscar dados na tabela secundária
        include: [{
            model: db.Situations,
            attributes: ['nameSituation']
        }]
    });

    // Acessa o IF se encontrar o registro no BD
    if (user) {

        // Salvar o log no nível info
        logger.info({ message: "Usuário visualizado.", id, userId: req.userId, date: new Date() });

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
        logger.info({ message: "Usuário não encontrado.", id, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Usuário não encontrado!"
        });
    }

});

// Criar a rota cadastrar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/users
// A aplicação externa deve indicar que está enviado os dados em formato de objeto: Content-Type: application/json
// Dados em formato de objeto
/*
{
    "name": "Cesar",
    "email": "cesar@celke.com.br",
    "situationId": 1
}
*/
router.post("/users", eAdmin, async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    var data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        situationId: yup.number("Erro: Necessário preencher o campo situação!")
            .required("Erro: Necessário preencher o campo situação!"),
        password: yup.string("Erro: Necessário preencher o campo senha!")
            .required("Erro: Necessário preencher o campo senha!")
            .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
        email: yup.string("Erro: Necessário preencher o campo e-mail!")
            .required("Erro: Necessário preencher o campo e-mail!")
            .email("Erro: Necessário preencher e-mail válido!"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
            .required("Erro: Necessário preencher o campo nome!")
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
        where: { email: data.email }

    });
    //console.log(user);

    // Acessa o IF se encontrar o registro no BD
    if (user) {

        // Salvar o log no nível info
        logger.info({ message: "Tentativa de cadastro de e-mail já cadastrado.", name: data.name, email: data.email, situationId: data.situationId, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Este e-mail já está cadastrado!"
        });
    }

    // Criptografar a senha
    data.password = await bcrypt.hash(String(data.password), 8);

    // Salvar no BD
    await db.Users.create(data).then((dataUser) => {

        // Salvar o log no nível info
        logger.info({ message: "Usuário cadastrado com sucesso.", name: data.name, email: data.email, situationId: data.situationId, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            message: "Usuário cadastrado com sucesso!",
            dataUser
        });
    }).catch(() => {

        // Salvar o log no nível info
        logger.info({ message: "Usuário não cadastrado.", name: data.name, email: data.email, situationId: data.situationId, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Usuário não cadastrado com sucesso!"
        });
    });
});

// Criar a rota editar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/users
// A aplicação externa deve indicar que está enviado os dados em formato de objeto Content-Type: application/json
// Dados em formato de objeto
/*{
    "id": 7,
    "name": "well7",
    "email": "well7@well.com.br",
    "situationId": 1
}
*/
router.put("/users", eAdmin, async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    const data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        situationId: yup.number("Erro: Necessário preencher o campo situação!")
            .required("Erro: Necessário preencher o campo situação!"),
        email: yup.string("Erro: Necessário preencher o campo e-mail!")
            .required("Erro: Necessário preencher o campo e-mail!")
            .email("Erro: Necessário preencher e-mail válido!"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
            .required("Erro: Necessário preencher o campo nome!"),
        id: yup.string("Erro: Necessário enviar o id do usuário!")
            .required("Erro: Necessário enviar o id do usuário!")
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
                [Op.ne]: Number(data.id)
            }
        }

    });

    // Acessa o IF se encontrar o registro no BD
    if (user) {

        // Salvar o log no nível info
        logger.info({ message: "Tentativa de usar e-mail já cadastrado em outro usuário.", id: data.id, name: data.name, email: data.email, situationId: data.situationId, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Este e-mail já está cadastrado!"
        });
    }

    // Editar no BD
    await db.Users.update(data, { where: { id: data.id } })
        .then(() => {

            // Salvar o log no nível info
            logger.info({ message: "Usuário editado com sucesso.", id: data.id, name: data.name, email: data.email, situationId: data.situationId, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Usuário editado com sucesso!"
            });
        }).catch(() => {

            // Salvar o log no nível info
            logger.info({ message: "Usuário não editado.", id: data.id, name: data.name, email: data.email, situationId: data.situationId, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Usuário não editado com sucesso!"
            });
        });

});
//Criar rota editar senha
router.put("/users-password", eAdmin, async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    const data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({

        password: yup.string("Erro: Necessário preencher o campo senha!")
            .required("Erro: Necessário preencher o campo senha!")
            .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
        id: yup.string("Erro: Necessário enviar o id do usuário!")
            .required("Erro: Necessário enviar o id do usuário!")
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
    await db.Users.update(data, { where: { id: data.id } })
        .then(() => {

            // Salvar o log no nível info
            logger.info({ message: "Senha do usuário editado com sucesso.", id: data.id, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Senha do usuário editado com sucesso!"
            });
        }).catch(() => {

            // Salvar o log no nível info
            logger.info({ message: "Senha do usuário não editado.", id: data.id, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Senha do usuário não editado!"
            });
        });

});

// Criar a rota editar imagem e receber o parâmentro id enviado na URL 
// Endereço para acessar através da aplicação externa: http://localhost:8080/users/users-image/1
router.put("/users-image/:id", eAdmin, upload.single('image'), async (req, res) => {

    // Receber o id enviado na URL
    const { id } = req.params;
    //console.log(id);

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
        where: { id }

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
                    logger.info({ message: "Excluida a imagem do usuário.", id, image: user.dataValues.image, userId: req.userId, date: new Date() });
                });
            }
        });
    }

    // Editar no BD
    db.Users.update(
        { image: req.file.filename },
        { where: { id } })
        .then(() => {

            // Salvar o log no nível info
            logger.info({ message: "Imagem do usuário editado com sucesso.", image: req.file.filename, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Imagem editada com sucesso!"
            });
        }).catch(() => {

            // Salvar o log no nível info
            logger.info({ message: "Imagem do usuário não editado.", image: req.file.filename, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Imagem não editada!"
            });
        });
});

// Criar a rota apagar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/users/3
router.delete("/users/:id", eAdmin, async (req, res) => {

    // Receber o parâmetro enviado na URL
    const { id } = req.params;

    // Apagar usuário no BD utilizando a MODELS users
    await db.Users.destroy({
        // Acrescentar o WHERE na instrução SQL indicando qual registro excluir no BD
        where: { id }
    }).then(() => {

        // Salvar o log no nível info
        logger.info({ message: "Usuário apagado com sucesso.", id, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            message: "Usuário apagado com sucesso!"
        });
    }).catch(() => {

        // Salvar o log no nível info
        logger.info({ message: "Usuário não apagado.", id, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Usuário não apagado com sucesso!"
        });
    });
});

// Exportar a instrução que está dentro da constante router 
module.exports = router;