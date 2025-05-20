const oracledb = require("oracledb");
const express = require('express');
const dbConfig = require("../ConfigDB");
const funcoes = require('../funcoesGlobais');

const { Client, Buttons, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// Função para enviar uma mensagem automática para um número específico cliente
/*const enviarMensagem = async (numero, mensagem) => {
    // O número deve incluir o código do país e o sufixo "@c.us"
    const chatId = `${numero}@c.us`;

    try {
        await client.sendMessage(chatId, mensagem);
        console.log(`Mensagem enviada para ${numero}`);
    } catch (error) {
        console.error(`Erro ao enviar mensagem para ${numero}:`, error);
    }
};
*/

// Função para enviar uma mensagem automática para cliente
const enviarMsgCliente = (client) => {
    // O número deve incluir o código do país e o sufixo "@c.us"
    //const chatId = `${numero}@c.us`;

    const conex = async (req, res) => {
        let connection;
  
        try {
          connection = await oracledb.getConnection(dbConfig);

          let result = await connection.execute(
            `
            select EW.ENVIO_WHATSAPP_ID        ENVIO_WHATSAPP_ID,
            case
              WHEN EW.ENWH_CELULAR LIKE '+%' THEN substr(EW.ENWH_CELULAR, 2, 11)||'@c.us' 
              when LENGTH(EW.ENWH_CELULAR) = 11 then
                   '55'||substr(EW.ENWH_CELULAR, 1, 2)||substr(EW.ENWH_CELULAR, 4, 8)||'@c.us'       
              when LENGTH(EW.ENWH_CELULAR) = 10 then
                   '55'||substr(EW.ENWH_CELULAR, 1, 2)||substr(EW.ENWH_CELULAR, 3, 8)||'@c.us'       
              end             ENWH_CELULAR, 
              
              case
                when LENGTH(EW.ENWH_CELULAR) = 8 then
                     'erro1'  
                when LENGTH(EW.ENWH_CELULAR) = 9 then
                     'erro2'   
                when EW.ENWH_CELULAR is null then
                     'erro3'
                when LENGTH(EW.ENWH_CELULAR) = 1 then
                     'erro4'
                when LENGTH(EW.ENWH_CELULAR) = 2 then
                     'erro5'
                when LENGTH(EW.ENWH_CELULAR) = 3 then
                     'erro6'    
                when LENGTH(EW.ENWH_CELULAR) = 4 then
                     'erro7'     
                when LENGTH(EW.ENWH_CELULAR) = 5 then
                     'erro8'     
                when LENGTH(EW.ENWH_CELULAR) = 6 then
                     'erro9'     
                when LENGTH(EW.ENWH_CELULAR) = 7 then
                     'erro10' 
                when LENGTH(EW.ENWH_CELULAR) = 12 and EW.ENWH_CELULAR LIKE '+%' then
                     'Ok'    
                when LENGTH(EW.ENWH_CELULAR) = 12 then
                     'erro11'     
                when LENGTH(EW.ENWH_CELULAR) = 13 then
                     'erro12'                                   
                else 'Ok'          
              end             ERRO_ENVIO_CLIENTE,
  
                   EW.ENWH_MSG_ENVIO           ENWH_MSG_ENVIO     
              from ENVIO_WHATSAPP EW
             where EW.ENWH_STATUS            = 'A Enviar'
               and EW.STATUS                 = 'Ativo '
      
             `,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );

          for (let iResult of result.rows) {
            let ENVIO_WHATSAPP_ID = iResult.ENVIO_WHATSAPP_ID; // ID_ENVIO_WHATSAPP
            let ENWH_CELULAR = iResult.ENWH_CELULAR; // NUMERO DO CELULAR QUE VAI RECEBER A MSG
            let ERRO_ENVIO_CLIENTE = iResult.ERRO_ENVIO_CLIENTE; // ERRO NO NUMERO DE CELULAR DO CLIENTE
            let MSG_A_ENVIAR = iResult.ENWH_MSG_ENVIO; //MENSAGEM A SER ENVIADA
  
            let contato = ENWH_CELULAR //"556284315872@c.us"; // ENWH_CELULAR  //NUMERO_CLIENTE//'556284315872@c.us';
            let valores = ` Msg Automatica : ${MSG_A_ENVIAR} \n `; // ${} serve para concatenar as variaveis.
  
            //client.sendMessage("556284315872@c.us", valores);
  

            if (ERRO_ENVIO_CLIENTE === "erro1") {
              ERRO_ENVIO = "Erro ao enviar numero de telefone sem DDD";
            } else if (ERRO_ENVIO_CLIENTE === "erro2") {
              ERRO_ENVIO = "Erro ao enviar numero de telefone sem DDD";
            } else if (ERRO_ENVIO_CLIENTE === "erro3") {
              ERRO_ENVIO =
                "Erro ao enviar cliente sem numero de celular cadastrado";
            }else if ((ERRO_ENVIO_CLIENTE === "erro4")| (ERRO_ENVIO_CLIENTE === "erro5") | (ERRO_ENVIO_CLIENTE === "erro6")
                     |(ERRO_ENVIO_CLIENTE === "erro7") | (ERRO_ENVIO_CLIENTE === "erro8") | (ERRO_ENVIO_CLIENTE === "erro9")
                     | (ERRO_ENVIO_CLIENTE === "erro10") | (ERRO_ENVIO_CLIENTE === "erro11") | (ERRO_ENVIO_CLIENTE === "erro12")) {
              ERRO_ENVIO =
                "Erro ao enviar telefone do cliente invalido ";
            }
  
            if (ERRO_ENVIO_CLIENTE === "Ok") {           
                client.sendMessage(contato, valores);
              //console.log(`Mensagem enviada para: ${contato}`);
              try {
                let updateResult = await connection.execute(
                  `UPDATE ENVIO_WHATSAPP
                      SET USUARIO_ALTERACAO = 'ENVIO',
                          DATA_ALTERACAO = sysdate,
                          ENWH_STATUS = 'Enviado'
                    WHERE ENVIO_WHATSAPP_ID = :ENVIO_WHATSAPP_ID`,
                  [ENVIO_WHATSAPP_ID],
                  { autoCommit: true }
                );
                console.log(`Atualização bem-sucedida para ID: ${ENVIO_WHATSAPP_ID}`, updateResult);
            } catch (updateError) {
                console.error(`Erro ao atualizar status para ID: ${ENVIO_WHATSAPP_ID}`, updateError);
            }              
              
            }
            if (
              ERRO_ENVIO_CLIENTE === "erro1" |
              ERRO_ENVIO_CLIENTE === "erro2" |
              ERRO_ENVIO_CLIENTE === "erro3" |
              ERRO_ENVIO_CLIENTE === "erro4" |
              ERRO_ENVIO_CLIENTE === "erro5" |
              ERRO_ENVIO_CLIENTE === "erro6" |
              ERRO_ENVIO_CLIENTE === "erro7" |
              ERRO_ENVIO_CLIENTE === "erro8" |
              ERRO_ENVIO_CLIENTE === "erro9" |
              ERRO_ENVIO_CLIENTE === "erro10" |
              ERRO_ENVIO_CLIENTE === "erro11" |
              ERRO_ENVIO_CLIENTE === "erro12" 
            ) {
              console.log(ERRO_ENVIO, 'msg11');
              await connection.execute(
                `update ENVIO_WHATSAPP
                    set USUARIO_ALTERACAO = 'ENVIO',
                        DATA_ALTERACAO    = sysdate,
                        ENWH_STATUS       = 'Nao Enviado',
                        ENWH_MSG_RETORNO  = :ERRO_ENVIO
                  where ENVIO_WHATSAPP_ID = :ENVIO_WHATSAPP_ID
                `,
                [ERRO_ENVIO, ENVIO_WHATSAPP_ID],
                { autoCommit: true }
              );
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          if (connection) {
            try {
              await connection.close();
            } catch (error) {
              console.error(error);
            }
          }
        }
      };
      
      conex(); 
};


 // Exportando 
 module.exports = {
    enviarMsgCliente,
    
};