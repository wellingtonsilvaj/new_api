// Manipular token de autenticação
const jwt = require('jsonwebtoken');
// Módulo "util" fornece funções para imprimir strings formatadas
const { promisify } = require('util');
// Incluir o arquivo com as variáveis de ambiente
require('dotenv').config();
// Incluir o arquivo responsável em salvar os logs
const logger = require('../services/loggerServices');

// Exportar para usar em outras partes do projeto
module.exports = {
    eAdmin: async function (req, res, next) {
        //return res.json({message: "Validar token."});

        // Receber o cabeçalho da requisição
        const authHeader = req.headers.authorization;
        //console.log(authHeader);

        // Acessa o IF quando não existe dados no cabeçalho
        if (!authHeader) {

            // Salvar o log no nível info
            logger.info({ message: "Tentativa de acesso a página restrita sem token.", date: new Date() });

            // Retornar objeto como resposta
            return res.status(401).json({
                error: true,
                message: "Erro: Necessário realizar o login para acessar a página!",
            });
        }

        // Separar o token da palavra bearer
        const [bearer, token] = authHeader.split(' ');
        //console.log(token);

        // Se o token estiver vazio retorna erro
        if (!token) {

            // Salvar o log no nível info
            logger.info({ message: "Tentativa de acesso a página restrita sem token.", date: new Date() });

            // Retornar objeto como resposta
            return res.status(401).json({
                error: true,
                message: "Erro: Necessário enviar o token!",
            });
        }

        // Permanece no try se conseguir executar corretamente
        try {
            // Validar o token
            const decode = await promisify(jwt.verify)(token, process.env.SECRET);
            //console.log(decode);

            // Atribuir como parâmetro o id do usuário que está no token
            req.userId = decode.id;
            //req.userName = decode.name;

            return next();

        } catch (error) { // Acessa o catch quando não conseguir executar 

            // Salvar o log no nível info
            logger.info({ message: "Tentativa de acesso a página restrita com token inválido.", date: new Date() });

            // Retornar objeto como resposta
            return res.status(401).json({
                error: true,
                message: "Erro: Necessário realizar o login para acessar a página!",
            });
        }
    }
}