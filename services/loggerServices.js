//Incluir a biblioteca de log
const { createLogger, transports, format } = require('winston');

//Criar o logger personalizado
const logger = createLogger({

    //Definir o nível mínimo de log (debug, info, warn, error)
    level: "debug",

    //Definir o formato das mensagens de log (info, warn, error, etc.)
    transports: [
        new transports.File({
            filename: "./logs/arquivo_de_log.log",
        })
    ]
});

//Exporta o logger para que possa ser usado em outros módulos
module.exports = logger;