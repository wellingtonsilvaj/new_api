//Incluir as bibliotecas
//Gerencia as requisições, rotas e URLs, entre outras funcionalidades
const express = require('express');
//Chamar a função express
const router = express.Router();
//Incluir conexão com o BD
const db = require("../db/models");
//Criptografar sennha
const bcrypt = require('bcryptjs');
//Gerar token de autenticação
const jwt = require('jsonwebtoken');
//Criar rota login
//Endereço para acessar a api através de aplicação externa: http://localhost:8080/login
router.post("/login", async (req, res) => {

    //Receber os dados enviados no corpo da requisição
    var data = req.body;
    
    //Recuperar o registro do BD
    const user = await db.Users.findOne({

        //Indicar quais colunas recuperar
        attributes: ['id', 'name', 'email', 'password'],

        //Acrescentando condição para indicar qual registro deve ser retornado do BD
        where: {email: data.email}
    });
   //AAcessa o IF se encontrar o registro no BD
   if(!user){
    //Retornar objeto como resposta
    return res.status(401).json({
        error: true,
        message: "Erro: usuário ou senha incorreta!"

    });
   }
   //Comparar a senha do usuario com a senha salva no BD
   if(!(await bcrypt.compare(String(data.password), String(user.password)))){
    //Retornar objeto como resposta
    return res.status(401).json({
        error: true,
        message:"Erro: usuário ou senha incorreta"
    })
   }

   //Gerar token de autenticação
   const token = jwt.sign({ id: user.id}, "ljsad5d85df5as8das4",{
    expiresIn: 600 //10m
   });

   //Retornar objeto como resposta
   return res.json({
        error: false,
        message:"Login realizado com sucesso",
        user: {id: user.id, name: user.name, email: user.email, token }
   });
});


//Exportar a instrução que está dentro da constante router
module.exports = router;