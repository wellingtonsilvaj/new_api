//Incluir as bibliotecas
//Gerencia as requisições, rotas e URLs, entre outras funcionalidades
const express = require('express');
//Chamar a função express
const router = express.Router();
//Criptografar sennha
const bcrypt = require('bcryptjs');
//Valida input do formulario
const yup = require('yup');
//Gerar token de autenticação
const jwt = require('jsonwebtoken');
//Incluir o arquivo com as variáveis de ambiente
require('dotenv').config();
//Incluir conexão com o BD
const db = require("../db/models");
//Incluir o arquivo responsável em salvar logs
const logger = require('../services/loggerServices');

//Criar rota login
//Endereço para acessar a api através de aplicação externa: http://localhost:8080/login
router.post("/login",  async (req, res) => {

    //Receber os dados enviados no corpo da requisição
    var data = req.body;

     //Validar os campos ultilizando o yup
     const schema = yup.object().shape({
        password: yup.string("Erro: Necessário preencher o campo Senha!")
        .required("Erro: Necessário preencher o campo Senha!"),
        email: yup.string("Erro: Necessário preencher o campo E-mail")
        .required("Erro: Necessário preencher o campo E-mail!")
        .email("Erro: Necessário preencher e-mail válido!"),
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
        attributes: ['id', 'name', 'email', 'password'],

        //Acrescentando condição para indicar qual registro deve ser retornado do BD
        where: {email: data.email}
    });
   //AAcessa o IF se encontrar o registro no BD
   if(!user){

    //Salvar o log no nivel error
    logger.warn({message: "Tentativa de login com email incorretos.", email:data.email});
    //Retornar objeto como resposta
    return res.status(401).json({
        error: true,
        message: "Erro: usuário ou senha incorreta!"

    });
   }
   //Comparar a senha do usuario com a senha salva no BD
   if(!(await bcrypt.compare(String(data.password), String(user.password)))){

    //Salvar o log no nivel error
    logger.warn({message: "Tentativa de login com senha incorretos.", email:data.email});

    //Retornar objeto como resposta
    return res.status(401).json({
        error: true,
        message:"Erro: usuário ou senha incorreta"
    })
   }

   //Gerar token de autenticação
   const token = jwt.sign({ id: user.id /*name: user.name */}, process.env.SECRET,
    {
    expiresIn: 600 //10m
   });

   //Retornar objeto como resposta
   return res.json({
        error: false,
        message:"Login realizado com sucesso",
        user: {id: user.id, name: user.name, email: user.email, token }
   });
});

//Criar a rota recuperar senha
//Endereço para acessar a API atraves de aplicação externa: http://localhost:8080/recover-password
router.post("/recover-password", async (req, res) => {

    //Receber os dados enviados no corpo da requisição
    var data = req.body;

     //Validar os campos ultilizando o yup
     const schema = yup.object().shape({
        urlRecoverPassword: yup.string("Erro: Necessário enviar a URL!")
            .required("Erro: Necessário enviar a URL!"),
        email: yup.string("Erro: Necessário preencher o campo E-mail")
            .required("Erro: Necessário preencher o campo E-mail!")
        .email("Erro: Necessário preencher e-mail válido!"),
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
        attributes: ['id', 'email'],

        //Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: {
            email: data.email
        }
    });

    //Acessa o IF se encontrar o registro no BD
    if(!user) {

        //Salvar log no nivel info
        logger.info({message: "Tentativa recuperar senha com e-mail incorreto.", email: data.email, date: new Date()});
        
        //Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: E-mail não está cadastrado!"
        });
    }

    //Gerar a chave para recuperar a senha
    var recoverPassword = (await bcrypt.hash(data.email, 8)).replace(/\./g, ""). replace(/\//g, "");

    //Editar o registro no BD
    await db.Users.update({ recoverPassword }, {
        where: { id: user.id }
    }).then(() => {
        //Retornar objeto como resposta
        return res.json({
            error: false,
            message:"Enviado e-mail com instruções para recuperar a sennha. Acesse a sua caixa de Email para recuperar a senha!"
           
        });
    }).catch(() => {

        //Salvar log no nivel warn
        logger.warn({message: "E-mail recuperar senha não enviado. Erro editar usuário no Banco de dados", email: data.email, date: new Date()});
        
        //Retornar objeto como resposta
        return res.json({
            error: true,
            message:"Erro: Link recuperar senha não enviado, entre em contato com o suporte: " + process.env.EMAIL_ADM,

    });
});
});

//Exportar a instrução que está dentro da constante router
module.exports = router;