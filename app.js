//Incluir as bibliotecas
//Gerencia as requisições, rotas e URLs, entre outras funcionalidades
const express = require('express');
//Incluir o módulo para gerenciar diretótios e caminhos
const path = require('path');
//Importar a biblioteca para permitir conexão externa
const cors = require('cors');
//Chamar a função express
const app = express();

//Criar o middleware para receber os dados no corpo da requisição
app.use(express.json());

//Criar middleware para permitir requisição externa
app.use((req, res, next) => {
    //Qualquer endereço pode fazer requisição "*"
    res.header("Access-Control-Allow-Origin", "*");
    //Tipos de métodos a API aceita
    res.header("Access-Control-Allow-Methodos", "GET, PUT, POST, DELETE");
    //Permitir o envio de dados para API
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization",);
    //Executar o cors
    app.use(cors());
    //Quando não houver erro deve continuar o processamento
    next();
});

//Local dos arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

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