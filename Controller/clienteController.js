const oracledb = require("oracledb");
const express = require('express');
const dbConfig = require("../ConfigDB");
const funcoes = require('../funcoesGlobais');

const { Client, Buttons, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// Função para mostrar o menu de produtos
const mostrarMenuCliente = (chat) => {
    
    const submenu = `
 *MENU DE CLIENTE*
 1️⃣ - Pedidos
 2️⃣ - Financeiro
 3️⃣ - Enviar mensagem para Atendimento
 4️⃣ - Voltar ao menu principal
 
 Escolha a categoria desejada.
     `;
     chat.sendMessage(submenu);
  
 };
 
/*inicio iury*/
const mostrarCliPedido = async (chat, userId) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        let result = await connection.execute(
            `SELECT PS.PEDIDO_SAIDA_ID  ID,
                    PS.PDSD_NR_PEDIDO   NUMERO,
                    PA.PRCR_NOME        CLIENTE,
                    TO_CHAR(PS.PDSD_DT_EMISSAO,'DD/MM/YYYY') DATA,
                    PA.PRCR_CGC_CPF     CPF_CNPJ,
                    PS.PDSD_VLR_TOTAL   VLR_PEDIDO,
                    (SELECT AP.ANPD_ANDAMENTO 
                       FROM ANDAMENTO_PEDIDO AP 
                      WHERE AP.ANDAMENTO_PEDIDO_ID = fnc_ret_ult_andamento(PS.PEDIDO_SAIDA_ID) 
                        AND ROWNUM <= 1) ULT_ANDAMENTO,
                    PS.PEDIDO_SAIDA_ID   PEDIDO_SAIDA_ID    
             FROM PEDIDO_SAIDA PS,
                  PARCEIRO PA
             WHERE PA.PARCEIRO_ID = PS.PARCEIRO_ID
               AND PA.PRCR_CGC_CPF <> :CPF_CNPJ
               AND PS.PDSD_STATUS IN ('Reservado','Faturado')
               /*AND PS.PDSD_DT_EMISSAO >= (SYSDATE-30)*/
               and ps.pdsd_nr_pedido = '59267'
               `,
            [global.CpfCnpj],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!result || result.rows.length === 0) {
            chat.sendMessage('Não localizado pedidos para este Cliente!');
            await funcoes.sleep(1000);
            //cliente.mostrarMenuCliente(chat);
            module.exports.mostrarMenuCliente(chat);

            return;
        }

        // Salva na memória temporária global por usuário
        if (!global.listaPedidos) global.listaPedidos = {};
        global.listaPedidos[userId] = result.rows;
        if (!global.pedidosSelecionados) global.pedidosSelecionados = {};


        let mensagem = '*Pedidos:*\n\n';
        result.rows.forEach((pedido, index) => {
            mensagem += `*${index + 1}.* Pedido ${pedido.NUMERO} - ${pedido.DATA} - R$ ${funcoes.valorBR(pedido.VLR_PEDIDO)}\n`;
        });
        mensagem += '\n Selecione um pedido. (ex. 1,2,3)';

        chat.sendMessage(mensagem);

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
// Função para mostrar o financeiro cliente
/*const mostrarCliPedido = (chat) => {
    const conex = async (req, res) => {
        let connection;
  

        try {
          connection = await oracledb.getConnection(dbConfig);

          let result = await connection.execute(
            
             `
              select PS.PEDIDO_SAIDA_ID  ID,
                    PS.PDSD_NR_PEDIDO   NUMERO,
                    PA.PRCR_NOME        CLIENTE,
                    to_char(PS.PDSD_DT_EMISSAO,'DD/MM/YYYY') DATA,
                    PA.PRCR_CGC_CPF     CPF_CNPJ,
                    PS.PDSD_VLR_TOTAL   VLR_PEDIDO,
                    (SELECT AP.ANPD_ANDAMENTO 
                        FROM ANDAMENTO_PEDIDO AP 
                      where AP.ANDAMENTO_PEDIDO_ID = fnc_ret_ult_andamento(PS.PEDIDO_SAIDA_ID) 
                        and rownum <= 1)   ULT_ANDAMENTO
                from PEDIDO_SAIDA PS,
                    PARCEIRO     PA
              where PA.PARCEIRO_ID        = PS.PARCEIRO_ID
                and PA.PRCR_CGC_CPF       <> :CPF_CNPJ
                and PS.PDSD_STATUS       IN ('Reservado','Faturado')
                and PS.PDSD_DT_EMISSAO   >= (sysdate-15)
              `,
            [CpfCnpj],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
  
        // Verificar se o result é null ou undefined
//        if (result == null) {
//            chat.sendMessage('Não localizado pedidos para este Cliente!');
//            return;
//        }


      // Verificar se o result.rows tem registros
         if (!result || result.rows.length === 0) {
           chat.sendMessage('Não localizado pedidos para este Cliente!');
           funcoes.sleep(1000);
           mostrarMenuCliente(chat);        
           return;
          }        
          for (let iResult of result.rows) {
          
  
              let ID           = iResult.ID;  // Colunas podem estar em maiúsculas
              let NUMERO       = iResult.NUMERO;
              let CLIENTE      = iResult.CLIENTE;
              let DATA         = iResult.DATA;
              let CPF_CNPJ     = iResult.CPF_CNPJ;
              let ULTANDAMENTO = iResult.ULT_ANDAMENTO;
              let VLR_PEDIDO   = funcoes.valorBR(iResult.VLR_PEDIDO);
              //console.log(`ID: ${ID}, Cliente: ${CLIENTE}, CPF/CNPJ: ${CPF_CNPJ}`);            
            let contato = CLIENTE; //"556284315872@c.us"; // ENWH_CELULAR  //NUMERO_CLIENTE//'556284315872@c.us';
            let valores = `Pedidos :\n Cliente: ${CLIENTE}\n CPF/CNPJ: ${CPF_CNPJ}\n Data: ${DATA}\n Valor: ${VLR_PEDIDO}\n Ultimo Andamento:${ULTANDAMENTO}\n `;
            //client.sendMessage("556284315872@c.us", valores);
            chat.sendMessage(valores);
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
};*/
/*fim iury*/ 
//inicio iury
const obterPedidosEmAberto = async (CpfCnpj) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        let result = await connection.execute(
            `SELECT 
                PS.PEDIDO_SAIDA_ID  ID,
                PS.PDSD_NR_PEDIDO   NUMERO,
                PA.PRCR_NOME        CLIENTE,
                TO_CHAR(PS.PDSD_DT_EMISSAO,'DD/MM/YYYY') DATA,
                PA.PRCR_CGC_CPF     CPF_CNPJ,
                PS.PDSD_VLR_TOTAL   VLR_PEDIDO,
                (SELECT AP.ANPD_ANDAMENTO 
                    FROM ANDAMENTO_PEDIDO AP 
                 WHERE AP.ANDAMENTO_PEDIDO_ID = fnc_ret_ult_andamento(PS.PEDIDO_SAIDA_ID) 
                   AND ROWNUM <= 1) AS ULT_ANDAMENTO
             FROM PEDIDO_SAIDA PS
             JOIN PARCEIRO PA ON PA.PARCEIRO_ID = PS.PARCEIRO_ID
             WHERE PA.PRCR_CGC_CPF <> :CPF_CNPJ
               AND PS.PDSD_STATUS IN ('Reservado','Faturado')
               AND PS.PDSD_DT_EMISSAO >= (SYSDATE - 15)`,
            [CpfCnpj],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return result.rows; // retorna a lista de pedidos
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return [];
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

//fim iury
// Função para mostrar o financeiro cliente
const mostrarCliFinanceiro = (chat) => {

    const conex = async (req, res) => {
        let connection;
  
        try {
          connection = await oracledb.getConnection(dbConfig);

          let result = await connection.execute(
            /*`
            select ID,
                   NUMERO,
                   PARCELA,
                   CLIENTE,
                   to_char(DATA,'DD/MM/YYYY') DATA,
                   to_char(DATA_VENC,'DD/MM/YYYY')DATA_VENC,
                   CPF_CNPJ,
                    trim(TO_CHAR(VALOR,'99999999990D99')) VALOR
              from TITULO  
              where CPF_CNPJ = :CPF_CNPJ
                and Data    >= sysdate-30
            order by NUMERO,PARCELA
             `,*/

             `
            select  TI.TITULO_ID             ID,
                    TI.TITL_NUMERO       NUMERO,
                    TI.TITL_PARCELA     PARCELA,
                    PA.PRCR_NOME        CLIENTE,
                    to_char(TI.DATA_INCLUSAO,'DD/MM/YYYY') DATA,
                    TI.TITL_POSICAO     POSICAO,
                    to_char(TI.TITL_DT_VENCTO,'DD/MM/YYYY')DATA_VENC,
                    PA.PRCR_CGC_CPF    CPF_CNPJ,
                      trim(TO_CHAR(TI.TITL_VALOR,'99999999990D99')) VALOR
                from TITULO   TI,
                    PARCEIRO PA
                where  TI.PARCEIRO_ID      = PA.PARCEIRO_ID
                  and not TI.TITL_POSICAO in ('Quitado','Cancelado')
                  AND TI.TITL_DT_VENCTO >= TO_DATE('01/01/2025', 'DD/MM/YYYY')
                  and ROWNUM <= 2
              order by NUMERO,PARCELA
              `,             
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );

      // Verificar se o result.rows tem registros
         if (!result || result.rows.length === 0) {
           chat.sendMessage('Não localizado titulos abertos para este Cliente!');
           funcoes.sleep(1000);
           //mostrarMenuCliente(chat);        
           return;
          }     
    
          for (let iResult of result.rows) {

              let ID           = iResult.ID;  // Colunas podem estar em maiúsculas
              let NUMERO       = iResult.NUMERO;
              let PARCELA      = iResult.PARCELA;
              let CLIENTE      = iResult.CLIENTE;
              let DATA         = iResult.DATA;
              let POSICAO      = iResult.POSICAO;
              let DATA_VENC    = iResult.DATA_VENC;
              let CPF_CNPJ     = iResult.CPF_CNPJ;
              let VALOR        = iResult.VALOR;
              //console.log(`ID: ${ID}, Cliente: ${CLIENTE}, CPF/CNPJ: ${CPF_CNPJ}`);            
            let contato = CLIENTE; //"556284315872@c.us"; // ENWH_CELULAR  //NUMERO_CLIENTE//'556284315872@c.us';
            let valores = `Titulo :\n Número: ${NUMERO} / ${PARCELA}\n Data: ${DATA}\n`;
            let valores2= `Data Vencimento: ${DATA_VENC}\n Posição:${POSICAO}\n Valor R$:${VALOR} `;                           
            //client.sendMessage("556284315872@c.us", valores);
            
            // Concatenando as duas mensagens em uma única string
            let mensagemCompleta = valores + valores2;

            chat.sendMessage(mensagemCompleta);
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
const mostrarStatusPedido = async (chat, userId) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        let result = await connection.execute(
            `
            select  ANP.ANPD_ANDAMENTO,
                    PS.PDSD_NR_PEDIDO
              from PEDIDO_SAIDA PS, ANDAMENTO_PEDIDO ANP
             where PS.PEDIDO_SAIDA_ID = ANP.PEDIDO_SAIDA_ID
               and PS.PDSD_NR_PEDIDO  = :PEDIDO
               AND ANP.ANPD_DATA = (
                                     SELECT MAX(ANP2.ANPD_DATA)
                                       FROM ANDAMENTO_PEDIDO ANP2
                                      WHERE ANP2.PEDIDO_SAIDA_ID = PS.PEDIDO_SAIDA_ID)
               `,
            [global.pedido],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length > 0) {
         const { ANPD_ANDAMENTO, PDSD_NR_PEDIDO } = result.rows[0];
        };

        let mensagem = `Status do pedido ${PDSD_NR_PEDIDO}:\nAndamento: ${ANPD_ANDAMENTO}`;

        chat.sendMessage(mensagem);

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


 // Exportando 
 module.exports = {
    mostrarMenuCliente,
    mostrarCliPedido,
    mostrarCliFinanceiro,
    obterPedidosEmAberto,
    mostrarStatusPedido
};