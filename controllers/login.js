// Incluir as bibliotecas
// Gerencia as requisições, rotas e URLs, entre outra funcionalidades
const express = require('express');
// Chamar a função express
const router = express.Router();
// Incluir a conexão com BD
const db = require("../db/models");
// Criptografar senha
const bcrypt = require('bcryptjs');
// Gerar token de autenticação
const jwt = require('jsonwebtoken');
// Incluir o arquivo com as variáveis de ambiente
require('dotenv').config();
// Validar input do formulário
const yup = require('yup');
// Incluir o arquivo responsável em salvar os logs
const logger = require('../services/loggerServices');
// Enviar e-mail
const nodemailer = require('nodemailer');

// Criar a rota login
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/login
router.post("/login", async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    var data = req.body;
    //console.log(data);

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        password: yup.string("Erro: Necessário preencher o campo senha!")
            .required("Erro: Necessário preencher o campo senha!")
            .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
        email: yup.string("Erro: Necessário preencher o campo usuário!")
            .required("Erro: Necessário preencher o campo usuário!")
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
        attributes: ['id', 'name', 'email', 'password'],

        // Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: { email: data.email }
    });
    //console.log(user);

    // Acessa o IF se encontrar o registro no BD
    if (!user) {

        // Salvar o log no nível warn
        logger.warn({ message: "Tentativa de login com usuário incorreto.", email: data.email, date: new Date() });

        // Retornar objeto como resposta
        return res.status(401).json({
            error: true,
            message: "Erro: Usuário ou a senha incorreta!"
        });
    }

    // Comparar a senha do usuário com a senha salva no BD
    if (!(await bcrypt.compare(String(data.password), String(user.password)))) {

        // Salvar o log no nível warn
        logger.warn({ message: "Tentativa de login com senha incorreta.", email: data.email, date: new Date() });

        // Retornar objeto como resposta
        return res.status(401).json({
            error: true,
            message: "Erro: Usuário ou a senha incorreta!"
        });
    }

    // Gerar token de autenticação
    const token = jwt.sign({ id: user.id/*, name: user.name*/ }, process.env.SECRET, {
        //expiresIn: 600 // 10 minutos
        expiresIn: '7d', // 7 dias
    });

    // Salvar o log no nível info
    logger.info({ message: "Login realizado com sucesso.", email: data.email, date: new Date() });

    // Retornar objeto como resposta
    return res.json({
        error: false,
        message: "Login realizado com sucesso!",
        user: { id: user.id, name: user.name, email: user.email, token }
    });
});

// Criar a rota recuperar senha
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/recover-password
router.post("/recover-password", async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    var data = req.body;
    //console.log(data);

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        urlRecoverPassword: yup.string("Erro: Necessário enviar a URL!")
            .required("Erro: Necessário enviar a URL!")
            .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
        email: yup.string("Erro: Necessário preencher o campo e-mail!")
            .required("Erro: Necessário preencher o campo e-mail!")
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
        attributes: ['id', 'name'],

        // Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: {
            email: data.email
        }
    });

    // Acessa o IF se encontrar o registro no BD
    if (!user) {

        // Salvar o log no nível info
        logger.info({ message: "Tentativa recuperar senha com e-mail incorreto.", email: data.email, date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: E-mail não está cadastrado!"
        });
    }

    // Gerar a chave para recuperar senha
    var recoverPassword = (await bcrypt.hash(data.email, 8)).replace(/\./g, "").replace(/\//g, "");

    // Editar o registro no BD
    await db.Users.update({ recoverPassword }, {
        where: { id: user.id }
    }).then(() => {

        // Criar a variável com as credenciais do servidor para enviar e-mail
        var transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Criar a variável com o conteúdo do e-mail
        var message_content = {
            from: process.env.EMAIL_FROM_PASS, // Rementente
            to: data.email, // E-mail do destinatário
            subject: "Recuperar senha", // Título do e-mail

            text: `Prezado(a) ${user.name} \n\nInformamos que a sua solicitação de alteração de senha foi recebida com sucesso.\n\nClique no link abaixo para criar uma nova senha em nosso sistema: ${data.urlRecoverPassword}${recoverPassword}\n\nEsta mensagem foi enviada a você pela empresa ${process.env.NAME_EMP}.\n\nVocê está recebendo porque está cadastrado no BD da empresa ${process.env.NAME_EMP}.Nenhum e-mail enviado pela empresa ${process.env.NAME_EMP} tem arquivos anexados ou solicita o preenchimento de senhas e informações cadastrais.\n\n`, // Conteúdo do e-mail somente texto

            html: `Prezado(a) ${user.name} <br><br>Informamos que a sua solicitação de alteração de senha foi recebida com sucesso.<br><br>Clique no link abaixo para criar uma nova senha em nosso sistema: <a href='${data.urlRecoverPassword}${recoverPassword}'>${data.urlRecoverPassword}${recoverPassword}</a><br><br>Esta mensagem foi enviada a você pela empresa ${process.env.NAME_EMP}.<br><br>Você está recebendo porque está cadastrado no BD da empresa ${process.env.NAME_EMP}.Nenhum e-mail enviado pela empresa ${process.env.NAME_EMP} tem arquivos anexados ou solicita o preenchimento de senhas e informações cadastrais.<br><br>`, // Conteúdo do e-mail com HTML

        }

        // Enviar e-mail
        transport.sendMail(message_content, function (err) {
            if (err) {

                // Salvar o log no nível warn
                logger.warn({ message: "E-mail recuperar senha não enviado.", email: data.email, date: new Date() });

                // Retornar objeto como resposta
                return res.status(400).json({
                    error: true,
                    message: "Erro: E-mail com as intruções para recuperar a senha não enviado, tente novamente ou entre em contato com o e-mail: " + process.env.EMAIL_ADM
                });


            } else {

                // Salvar o log no nível info
                logger.info({ message: "Enviado e-mail com instruções para recuperar a senha.", email: data.email, date: new Date() });

                // Retornar objeto como resposta
                return res.json({
                    error: false,
                    message: "Enviado e-mail com instruções para recuperar a senha. Acesse a sua caixa de e-mail para recuperar a senha!"
                });
            }
        })
    }).catch(() => {

        // Salvar o log no nível warn
        logger.warn({ message: "E-mail recuperar senha não enviado. Erro editar usuário no BD.", email: data.email, date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: true,
            message: "Erro: Link recuperar senha não enviado, entre em contato com o suporte: " + process.env.EMAIL_ADM,
        });

    })
});

// Criar a rota validar a chave recuperar senha
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/validate-recover-password
router.post('/validate-recover-password', async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    var data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        recoverPassword: yup.string("Erro: Necessário enviar a chave!")
            .required("Erro: Necessário enviar a chave!")
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
            recoverPassword: data.recoverPassword
        }
    });

    // Acessa o IF se encontrar o registro no BD
    if (user) {

        // Salvar o log no nível info
        logger.info({ message: "Validar chave recuperar senha, chave válida.", date: new Date() });

        // Retornar objeto como resposta
        return res.json({
            error: false,
            message: "Chave recuperar senha válida!",
        });
    } else {

        // Salvar o log no nível info
        logger.info({ message: "Validar chave recuperar senha, chave inválida.", date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Chave recuperar senha inválida!",
        });
    }
});

// Criar a rota atualizar a senha
// Endereço para acessar a api através de aplicação externa: http://localhost:8080/update-password
router.put("/update-password", async (req, res) => {

    // Receber os dados enviados no corpo da requisição
    var data = req.body;

    // Validar os campos utilizando o yup
    const schema = yup.object().shape({
        recoverPassword: yup.string("Erro: Necessário enviar a chave!")
            .required("Erro: Necessário enviar a chave!"),
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

    // Recuperar o registro do BD
    const user = await db.Users.findOne({

        // Indicar quais colunas recuperar
        attributes: ['id', 'email'],

        // Acrescentado condição para indicar qual registro deve ser retornado do BD
        where: {
            recoverPassword: data.recoverPassword
        }
    });

    // Acessa o IF se encontrar o registro no BD
    if (user) {

        //Criptografar a senha
        var password = await bcrypt.hash(data.password, 8);

        // Editar o registro no BD
        await db.Users.update({ recoverPassword: null, password }, {
            where: { id: user.id }
        }).then(() => {
            // Salvar o log no nível info
            logger.info({ message: "Senha editada com sucesso.", date: new Date() });

            // Retornar objeto como resposta
            return res.json({
                error: false,
                message: "Senha editada com sucesso!",
            });
        }).catch(() => {
            // Salvar o log no nível info
            logger.info({ message: "Senha não editada.", date: new Date() });

            // Retornar objeto como resposta
            return res.status(400).json({
                error: true,
                message: "Senha não editada!",
            });
        })


    } else {

        // Salvar o log no nível info
        logger.info({ message: "Chave recuperar senha inválida.", date: new Date() });

        // Retornar objeto como resposta
        return res.status(400).json({
            error: true,
            message: "Erro: Chave recuperar senha inválida!",
        });
    }
});

// Exportar a instrução que está dentro da constante router 
module.exports = router;