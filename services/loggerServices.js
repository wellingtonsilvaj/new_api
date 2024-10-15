// Incluir a biblioteca de log
const { createLogger, transports, format } = require('winston');

// Criar o logger personalizado
const logger = createLogger({

    // Definir o nível mínimo de log (debug, info, warn, error)
    level: "debug",

    // Definir o formato das mensagens de log como JSON
    format: format.json(),

    // Definir os métodos de log (info, warn, error, etc.) 
    transports: [

        new transports.File({
            filename: "./logs/arquivo_de_log.log",
        })
    ]
});

// Exporta o logger para que possa ser usado em outros módulos
module.exports = logger;

//*************** NIVEIS DE LOG NO WINSTON ******************//

//silly (nível 6): Usado para informações detalhadas, como registros de depuração profundamente detalhados que podem gerar uma grande quantidade de saída. Normalmente, não é ativado em ambientes de produção devido à sobrecarga.

//debug (nível 5): Usado para mensagens de depuração. Útil para rastrear problemas específicos em um aplicativo durante o desenvolvimento.

//verbose (nível 4): Mais detalhado do que debug. Pode ser útil quando você precisa de informações adicionais para entender o comportamento de um aplicativo.

//http (nível 3): Usado para registrar solicitações e respostas HTTP. Pode ser útil para monitorar chamadas de API ou interações com serviços externos.

//info (nível 2): Usado para informações gerais. Normalmente, é a configuração padrão para logs em ambientes de produção. Registra eventos importantes e informações úteis para a operação normal do aplicativo.

//warn (nível 1): Usado para registrar situações que não são erros, mas podem requerer atenção ou indicar problemas em potencial. Por exemplo, pode ser usado para alertar sobre a depreciação de recursos.

//error (nível 0): Usado para registrar erros graves que afetam a funcionalidade do aplicativo. Os logs de erro geralmente indicam um mau funcionamento e podem ser úteis para diagnóstico e solução de problemas.

//*************** NIVEIS DE LOG NA RFC5424 ******************//
// Nível RFC5424: https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1

//emerg (emergência) - Nível 0: Este é o nível mais alto de emergência e geralmente é usado para mensagens que indicam uma falha catastrófica no sistema. Use-o para erros graves que causam a interrupção completa do aplicativo. 

//alert (alerta) - Nível 1: Use este nível para mensagens que indicam uma situação que requer atenção imediata, mas que não é necessariamente catastrófica. Por exemplo, um problema que pode levar a uma falha em breve se não for tratado.

//crit (crítico) - Nível 2: Este nível é usado para mensagens que indicam um erro crítico, mas que não é necessariamente uma emergência imediata. Isso pode ser usado para situações que requerem ação urgente, mas não imediata.

//error (erro) - Nível 3: Use este nível para mensagens que indicam erros graves que não são críticos para o funcionamento do aplicativo, mas ainda precisam de atenção imediata.

//warning (aviso) - Nível 4: Use este nível para mensagens que indicam situações de aviso que não são erros, mas que podem indicar problemas potenciais. Isso é frequentemente usado para situações que podem ser ignoradas, mas que ainda merecem atenção.

//notice (aviso) - Nível 5: Este nível é usado para mensagens que fornecem informações importantes sobre o funcionamento normal do aplicativo. É útil para registrar eventos significativos.

//info (informação) - Nível 6: Use este nível para mensagens informativas gerais que são úteis para rastrear o fluxo de execução do aplicativo. Isso pode incluir informações sobre solicitações HTTP, eventos do aplicativo, etc.

//debug (depuração) - Nível 7: Este é o nível mais baixo e é usado para mensagens de depuração. É útil para rastrear detalhes específicos do funcionamento interno do aplicativo. Normalmente, você não usaria essas mensagens em produção, mas durante o desenvolvimento para depurar problemas.