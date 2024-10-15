// Incluir as bibliotecas
// Gerencia as requisições, rotas e URLs, entre outra funcionalidades
const express = require('express');
// Chamar a função express
const router = express.Router();
// Validar input do formulário
const yup = require('yup');
// Incluir a conexão com BD
const db = require("../db/models");
// Incluir o arquivo para validar o token
const { eAdmin } = require('../services/authService');
// Incluir o arquivo responsável em salvar os logs
const logger = require('../services/loggerServices');

// Criar a rota listar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/situations?page=1
router.get("/situations", eAdmin, async (req, res) => {

    // Receber o número da página, quando não é enviado o número da página é atribuido página 1
    const { page = 1 } = req.query;

    // Limite de registros em cada página
    const limit = 40;

    // Variável com o número da última página
    var lastPage = 1;

    // Contar a quantidade de registro no BD
    const countSituations = await db.Situations.count();

    // Acessa o IF quando encontrar registro no BD
    if (countSituations !== 0) {

        // Calcular a última página
        lastPage = Math.ceil(countSituations / limit);

    } else {
        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Nenhuma situação encontrada!"
        });
    }

    // Recuperar todas as situações do BD
    const situations = await db.Situations.findAll({

        // Indicar quais colunas recuperar
        attributes: ['id', 'nameSituation'],

        // Ordenar os registros pela coluna id na forma decrescente
        order: [['nameSituation', 'ASC']],

        // Calcular a partir de qual registro deve retornar e o limite de registros
        offset: Number((page * limit) - limit),
        limit: limit
    });

    // Acessa o IF se encontrar o registro no BD
    if (situations) {

        // Salvar o log no nível info
        logger.info({ message: "Listar situação.", userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            situations
        });
    } else {

        // Salvar o log no nível info
        logger.info({ message: "Listar situação não executado corretamente.", userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Nenhuma situação encontrada!"
        });
    }
});

// Criar a rota visualizar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/situations/1
router.get("/situations/:id", eAdmin, async (req, res) => {

    // Receber o parâmetro enviado na URL
    // http://localhost:8080/situations/1
    const { id } = req.params;

    // Recuperar o registro do BD
    const situation = await db.Situations.findOne({

        // Indicar quais colunas recuperar
        attributes: ['id', 'nameSituation', 'createdAt', 'updatedAt'],

        // Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: { id },
    });

    // Acessa o IF se encontrar o registro no BD
    if (situation) {

        // Salvar o log no nível info
        logger.info({ message: "Situação visualizada.", id, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            situation
        });
    } else {

        // Salvar o log no nível info
        logger.info({ message: "Situação não encontrada.", id, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Situação não encontrada!"
        });
    }

});

// Criar a rota cadastrar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/situations
// A aplicação externa deve indicar que está enviado os dados em formato de objeto: Content-Type: application/json
// Dados em formato de objeto
/*
{
    "nameSituation": "Ativo"
}
*/
router.post("/situations", eAdmin, async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    var data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        nameSituation: yup.string("Erro: Necessário preencher o campo nome situação!")
            .required("Erro: Necessário preencher o campo nome situação!"),
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

    // Salvar no BD
    await db.Situations.create(data).then((dataSituation) => {

        // Salvar o log no nível info
        logger.info({ message: "Situação cadastrada com sucesso.", nameSituation: data.nameSituation, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            message: "Situação cadastrada com sucesso!",
            dataSituation
        });
    }).catch(() => {

        // Salvar o log no nível info
        logger.info({ message: "Situação não cadastrada.", nameSituation: data.nameSituation, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Situação não cadastrada com sucesso!"
        });
    });
});

// Criar a rota editar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/situations
// A aplicação externa deve indicar que está enviado os dados em formato de objeto Content-Type: application/json
// Dados em formato de objeto
/*{
    "id": 1,
    "nameSituation": "Ativo"
}
*/
router.put("/situations", eAdmin, async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    const data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        nameSituation: yup.string("Erro: Necessário preencher o campo nome situação!")
            .required("Erro: Necessário preencher o campo nome situação!"),
        id: yup.string("Erro: Necessário enviar o id da situação!")
            .required("Erro: Necessário enviar o id da situação!")
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

    // Editar no BD
    await db.Situations.update(data, { where: { id: data.id } })
        .then(() => {

            // Salvar o log no nível info
            logger.info({ message: "Situação editada com sucesso.", id: data.id, nameSituation: data.nameSituation, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Situação editada com sucesso!"
            });
        }).catch(() => {

            // Salvar o log no nível info
            logger.info({ message: "Situação não editada.", id: data.id, nameSituation: data.nameSituation, userId: req.userId, date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Situação não editada com sucesso!"
            });
        });
});

// Criar a rota apagar
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/situations/3
router.delete("/situations/:id", eAdmin, async (req, res) => {

    // Receber o parâmetro enviado na URL
    const { id } = req.params;

    // Apagar situação no BD utilizando a MODELS Situations
    await db.Situations.destroy({
        // Acrescentar o WHERE na instrução SQL indicando qual registro excluir no BD
        where: { id }
    }).then(() => {

        // Salvar o log no nível info
        logger.info({ message: "Situação apagada com sucesso.", id, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            message: "Situação apagada com sucesso!"
        });
    }).catch(() => {

        // Salvar o log no nível info
        logger.info({ message: "Situação não apagada.", id, userId: req.userId, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Situação não apagada com sucesso!"
        });
    });
});

// Exportar a instrução que está dentro da constante router 
module.exports = router;