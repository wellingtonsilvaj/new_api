//Incluir as bibliotecas
//Gerencia as requisições, rotas e URLs, entre outras funcionalidades
const express = require('express');
//Chamar a função express
const router = express.Router();
//Valida input do formulario
const yup = require('yup');
//Incluir o arquivo para validar token
const {eAdmin } = require('../services/authServices');
//Incluir conexão com o BD
const db = require("../db/models");


//Criar rota cadastrar
router.post("/situations", eAdmin, async (req, res) => {

    //Receber os dados enviados no corpo da requisição
    var data = req.body;

    //Validar os campos ultilizando o yup
    const schema = yup.object().shape({
        nameSituation: yup.string("Erro: Necessário preencher o campo Nome da Situação!")
        .required("Erro: Necessário preencher o campo Nome da Situação!"),
    });

     //Verificar se todos os campos passaram pela validação
     try {
        await schema.validate(data);
    } catch (error) {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: error.errors

        });
    }
    //Salvar  no BD
    await db.Situations.create(data).then((dataSituation) => {
        //Retornar objeto como resposta
        return res.json({
            error: false,
            message: "Situação cadastrada com sucesso!",
            dataSituation
        });
    }).catch(() => {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Situação não cadastrada com sucesso!",

        });
    });
});

//Criar rota listar
router.get("/situations", eAdmin, async (req, res) => {

    //Receber o número da página, quando não é enviado o número da página é atribuido página 1
    const { page = 1 } = req.query;

    //Limite de registros em cada pag
    const limit = 40;

    //Variavel com o numero da ultima pag
    var lastPage = 1;

    //Contar a quantidade de registro no BD
    const countSituation = await db.Situations.count();

    //Acessa o IF quando encontrar registro no BD
    if (countSituation !== 0) {

        //calcular a ultima pág
        lastPage = Math.ceil(countSituation / limit);
        console.log(lastPage);

    } else {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: false,
            message: "Erro: Nenhuma situação encontrada!"
        });
    }


    //Recuperar todos os usuarios do BD
    const situations = await db.Situations.findAll({

        //Indicar quais colunas recuperar 
        attributes: ['id', 'nameSituation'],
        order: [['id', 'DESC']],

        //Calcular a partir de qual registro deve retorna e o limite de registros
        offset: Number((page * limit) - limit),
        limit: limit
    });

    //Acessa o ID se encontrar algum registro no BD
    if (situations) {
        //Retonar objeto como resposta
        return res.json({
            error: false,
            situations
        });
    } else {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: false,
            message: "Erro: Nenhuma situação encontrada!"
        });
    }
});

//Criar rota visualizar
router.get("/situations/:id",eAdmin, async (req, res) => {

    //http://localhost:8080/situations/4
    const { id } = req.params;

    //http://localhost:8080/situations/4?sit=5
    const situation = await db.Situations.findOne({

        //Indicar quais colunas recuperar
        attributes: ['id', 'nameSituation', 'createdAt', 'updatedAt'],

        //Acrescentando condição para qual registro deve ser retornado do BD
        where: { id },

    });
    //Acessa o IF se encontrar o registro no BD
    if (situation) {
        //Retonar objeto como resposta
        return res.json({
            error: false,
            situation
        });
    } else {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: false,
            message: "Erro: Situação encontrado!"
        });
    }


});

//Criar rota editar
/**{
    "id": "1",
    "nameSituation":"Ativo"
} */
router.put("/situations/",eAdmin, async (req, res) => {

    //Receber os dados enviados no corpo da requisição
    const data = req.body;

    //Validar os campos ultilizando o yup
    const schema = yup.object().shape({
        nameSituation: yup.string("Erro: Necessário preencher o campo Nome da Situação!")
            .required("Erro: Necessário preencher o campo Nome da Situação!"),
        id: yup.string("Erro: Necessário preencher o campo Id da situação")
            .required("Erro: Necessário preencher o campo Id da situção"),
    });

     //Verificar se todos os campos passaram pela validação
     try {
        await schema.validate(data);
    } catch (error) {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: error.errors

        });
    }

    //Editar no BD
    await db.Situations.update(data, { where: { id: data.id } })
        .then(() => {
            //Retonar objeto como resposta
            return res.json({
                error: false,
                message: "Situação editada com sucesso!"
            });

        }).catch(() => {
            //Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: Situação não editada com sucesso!"

            });
        });
});

//Criar rota delete
router.delete("/situations/:id",eAdmin, async (req, res) => {

    //Receber o parâmetro enviado na URL
    const { id } = req.params;

    //Apagar situação no BD utilizando MODELS users
    await db.Situations.destroy({
        //Acrescentar o WHERE na instrução SQL indicando qual registro excluir no BD
        where: { id }

    }).then(() => {
        //Retonar objeto como resposta
        return res.json({
            error: false,
            message: "Situação apagado com sucesso!"
        });

    }).catch(() => {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Situação não apagado com sucesso!"
        });
    });
});

//Exportar a instrução que está dentro da constante router
module.exports = router;