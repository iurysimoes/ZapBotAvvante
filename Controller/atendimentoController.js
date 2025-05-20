const oracledb = require("oracledb");
const express = require('express');
const dbConfig = require("../ConfigDB");
const funcoes = require('../funcoesGlobais');

const { Client, Buttons, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// Função para gravar mensagem atendimento
const gravarMsgAtendimento = (chat,body,userId,nruserId) => {
    
  const conex = async (req, res) => {
    let connection;

    try {
      connection = await oracledb.getConnection(dbConfig);
        
      
      await connection.execute(
        `
            begin
              declare 
                 V_RECEBER_WHATSAPP_ID RECEBER_WHATSAPP.RECEBER_WHATSAPP_ID%type;
              begin
                  V_RECEBER_WHATSAPP_ID := GENERATE_NEXT_ID('RECEBER_WHATSAPP','horus','TermSystem');
                  insert into RECEBER_WHATSAPP(RECEBER_WHATSAPP_ID,
                                               REWH_DT_RECEBIMENTO,
                                               REWH_POSICAO,
                                               REWH_MSG_RECEBIDA,
                                               REWH_NR_WHATSAPP,
                                               USUARIO_INCLUSAO,
                                               DATA_INCLUSAO,
                                               STATUS)
                                               
                       values               (V_RECEBER_WHATSAPP_ID,
                                             sysdate,
                                             'Recebido',
                                             '${body}',
                                             '${nruserId}',
                                             'BOT_AUTOMATICO',
                                             sysdate,
                                             'Ativo');
                  commit;
              end;
            end;

        `  
        ,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true }
        );

        chat.sendMessage(`*Mensagem Gravada com Sucesso!*`);
      
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



module.exports = {
    gravarMsgAtendimento
}