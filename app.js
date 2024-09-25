//Incluir as bibliotecas
//Gerencia as requisições, rotas e URLs, entre outras funcionalidades
const express = require('express');
//Chamar a função express
const app = express();

//Criar o middleware para receber os dados no corpo da requisição
app.use(express.json());


//Incluir as controllers
const users = require("./controllers/users");
const situations = require("./controllers/situations");
const login = require("./controllers/login");

//Criar rotas
app.use('/', users);
app.use('/', situations);
app.use('/', login);



//Iniciar o servidor na porta 8080, criar a função modelo Arrow function para retornar a mensagem de sucesso
app.listen(8080, () => {
    console.log("Servidor iniciado na porta 8080: http://localhost:8080");
});