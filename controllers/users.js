//Incluir as bibliotecas
//Gerencia as requisições, rotas e URLs, entre outras funcionalidades
const express = require('express');
//Chamar a função express
const router = express.Router();
//Criptografar sennha
const bcrypt = require('bcryptjs')
//Valida input do formulario
const yup = require('yup');
//Operador do sequelize
const { Op } = require("sequelize");
//Incluir o arquivo para validar token
const {eAdmin } = require('../services/authServices');
//Incluir conexão com o BD
const db = require("../db/models");


//Criar rota listar
//Endereço para acessar a api através de aplicação externa: http://localhost:8080/users?page=1
router.get("/users", eAdmin, async (req, res) => {

    //Receber o número da página, quando não é enviado o número da página é atribuido página 1
    const { page = 1 } = req.query;
    //Recuperar os valores que estão no token, tratado no authService.js
   // console.log(req.userId);
   // console.log(req.userName);

    //Limite de registros em cada página
    const limit = 40;

    //var com o numero da ultima pag
    var lastPage = 1;

    //Contar a quantidade de registro no BD
    const countUser = await db.Users.count();

    //Acessa o IF quando encontrar o registro no BD
    if (countUser !== 0) {
        //Calcular a ultima pag
        lastPage = Math.ceil(countUser / limit);
        //console.log(lastPage);
    } else {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: false,
            message: "Erro: Nenhum usuario encontrado!"
        });
    }

    //Recuperar todos os usuarios do BD
    const users = await db.Users.findAll({

        //Indicar quais colunas recuperar 
        attributes: ['id', 'name', 'email', 'situationId'],
        order: [['id', 'DESC']],

        //Bucar dados na tabela secundária
        include: [{
            model: db.Situations,
            attributes: ['nameSituation']
        }],

        //Calcular a partir de qual registro deve retorna e o limite de registros
        offset: Number((page * limit) - limit),
        limit: limit
    });

    //Acessa o ID se encontrar algum registro no BD
    if (users) {
        //Retonar objeto como resposta
        return res.json({
            error: false,
            users
        });
    } else {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: false,
            message: "Erro: Nenhum usuario encontrado!"
        });
    }
});

//Criar rota visualizar
router.get("/users/:id",eAdmin, async (req, res) => {

    //http://localhost:8080/users/4
    const { id } = req.params;

    //http://localhost:8080/users/4?sit=5
    const user = await db.Users.findOne({

        //Indicar quais colunas recuperar
        attributes: ['id', 'name', 'email', 'situationId', 'createdAt', 'updatedAt'],

        //Acrescentando condição para qual registro deve ser retornado do BD
        where: { id },

        //Buscar dados na tabela secundaria
        include: [{
            model: db.Situations,
            attributes: ['nameSituation']
        }]
    });

    //Acessa o IF se encontrar o registro no BD
    if (user) {
        //Retonar objeto como resposta
        return res.json({
            error: false,
            user
        });
    } else {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: false,
            message: "Erro: Usuário encontrado!"
        });
    }

});

//Criar rota cadastrar
router.post("/users", eAdmin, async (req, res) => {

    //Receber os dados enviados no corpo da requisição
    var data = req.body;

    //Validar os campos ultilizando o yup
    const schema = yup.object().shape({
        situationId: yup.number("Erro: Necessário preencher o campo situação!")
            .required("Erro: Necessário preencher o campo situação!"),
        password: yup.string("Erro: Necessário preencher o campo senha!")
            .required("Erro: Necessário preencher o campo senha!"),
        email: yup.string("Erro: Necessário preencher o campo email!")
            .required("Erro: Necessário preencher o campo email!")
            .email("Erro: Necessário preencher e-mail válido!"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
            .required("Erro: Necessário preencher o campo nome!"), 
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

    //Recuperar o registro do BD
    const user = await db.Users.findOne({
        
        //Indicar quais colunas recuperar
        attributes: ['id'],

        //Acrescentando condição para indicar qual registro deve ser retornado do BD
        where: {email: data.email}

    });

    //Acessa o IF se encontrar o registro no BD
    if(user){
        //Retornar objeto como resposta
         //Retornar objeto como resposta
         return res.status(400).json({
            error: true,
            message: "Erro: Este e-mail já está cadastrado!"
        });

    }

        
    //Criptografar a senha
    data.password = await bcrypt.hash(String(data.password), 8);
    
    //Salvar no BD
    await db.Users.create(data).then((dataUser) => {
        //Retonar objeto como resposta
        return res.json({
            error: false,
            message: "Usuário cadastrado com sucesso!",
            dataUser
        });
    }).catch(() => {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: usuário não cadastrado com sucesso!"

        });
    });
});


//Criar rota editar
//dados em formato de objeto
/*{
    "id": "7",
    "name": "Well77",
    "email": "well77@well.com.br",
    "situationId": 1
}*/
router.put("/users/",eAdmin, async (req, res) => {

    //Receber os dados enviados no corpo da requisição
    const data = req.body;

     //Validar os campos ultilizando o yup
     const schema = yup.object().shape({
        situationId: yup.number("Erro: Necessário preencher o campo situação!")
            .required("Erro: Necessário preencher o campo situação!"),
        email: yup.string("Erro: Necessário preencher o campo email!")
            .required("Erro: Necessário preencher o campo email!")
            .email("Erro: Necessário preencher e-mail válido!"),
        name: yup.string("Erro: Necessário preencher o campo nome!")
            .required("Erro: Necessário preencher o campo nome!"), 
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

    //Recuperar o registro do BD
    const user = await db.Users.findOne({
        
        //Indicar quais colunas recuperar
        attributes: ['id'],

        //Acrescentando condição para indicar qual registro deve ser retornado do BD
        where: {email: data.email,
            id: {
                //Operador de negação para ignorar o registro do usuario que está sendo editado
                [Op.ne]: data.id
            }
        }

    });

    //Acessa o IF se encontrar o registro no BD
    if(user){
        //Retornar objeto como resposta
         //Retornar objeto como resposta
         return res.status(400).json({
            error: true,
            message: "Erro: Este e-mail já está cadastrado!"
        });

    }


    //Editar no BD
    await db.Users.update(data, { where: { id: data.id } })
        .then(() => {
            //Retonar objeto como resposta
            return res.json({
                error: false,
                message: "Usuário editado com sucesso!"
            });

        }).catch(() => {
            //Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Erro: usuário não editado com sucesso!"

            });
        });

});

//Criar a rota editar imagem e receber o parâmetro id enviado na url
//Endereço para acessar através da aplicação externa: http://localhost:8080/users/users-image/1
router.put("/users-image/:id", async (req, res) =>{

    //Receber o id enviado na URL
    const { id } = req.params;
    console.log(id);

    //Retornar objeto como resposta
    return res.status(400).json({
        error: false,
        message: "Imagem editada com sucesso!"

    });

});
//Criar rota delete
router.delete("/users/:id",eAdmin, async (req, res) => {

    //Receber o parâmetro enviado na URL
    const { id } = req.params;

    //Apagar usuário no BD utilizando MODELS users
    await db.Users.destroy({
        //Acrescentar o WHERE na instrução SQL indicando qual registro excluir no BD
        where: { id }

    }).then(() => {
        //Retonar objeto como resposta
        return res.json({
            error: false,
            message: "Usuário apagado com sucesso!"
        });

    }).catch(() => {
        //Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: usuário não apagado com sucesso!"
        });
    });
});



//Exportar a instrução que está dentro da constante router
module.exports = router;