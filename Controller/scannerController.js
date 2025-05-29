const oracledb = require('oracledb');
const dbConfig = require('../ConfigDB');
// const mainBot = require('../index'); // Mantenha esta linha se estiver usando-a no 'validarVolume' original.
console.log('entrou scannerController');
// NOVA FUNÇÃO: Lógica de validação do banco de dados, retorna um objeto
async function performVolumeValidation(codigoBarras, idPedido = null) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // 1. Pega o pedido_saida_id com base no número do pedido
    const pedidoResult = await connection.execute(
      `SELECT ps.pedido_saida_id 
         FROM pedido_saida ps 
        WHERE ps.Pdsd_Nr_Pedido = :idPedido`,
      { idPedido }
    );
    
    if (!pedidoResult.rows || pedidoResult.rows.length === 0) {
      return {
        sucesso: false,
        mensagem: '❌ Número do pedido não encontrado.',
        finalizado: false
      };
    }
    const pedido_saida_id = pedidoResult.rows[0][0];

    const result = await connection.execute(
      `select c.volc_plataforma
         from volume_conferencia c
        where c.volume_conferencia_id = :codigo
          and c.pedido_saida_id       = :pedido_saida_id`,
      { codigo: codigoBarras, pedido_saida_id }
    );

    let mensagemBot = '';
    let volc_plataforma_valor = null;

    if (result.rows && result.rows.length > 0 && result.rows[0][0] !== null) {
      volc_plataforma_valor = result.rows[0][0];

       // ✅ Se chegou aqui, o código é válido → Agora faz o UPDATE no banco
      await connection.execute(
        `UPDATE volume_conferencia
            SET volc_confirma_cliente_zap = 'Sim'
          WHERE volume_conferencia_id = :codigo
            AND pedido_saida_id       = :pedido_saida_id`,
        { codigo: codigoBarras, pedido_saida_id },
        { autoCommit: true } // importante: salva a alteração no banco
      );
      // 3. Verifica se ainda há volumes pendentes do mesmo pedido
      const pendentes = await connection.execute(
        `SELECT COUNT(*) 
          FROM volume_conferencia 
          WHERE pedido_saida_id = :pedido_saida_id
            AND NVL(volc_confirma_cliente_zap, 'Não') <> 'Sim' `,
        { pedido_saida_id }
      );
      
      const totalPendentes = pendentes.rows[0][0];
      if (totalPendentes === 0) {
        return {
          sucesso: true,
          mensagem: '✅ Todos os volumes desse pedido já foram validados!',
          finalizado: true
        };                                          
      }

      return {
        sucesso: true,
        mensagem: `✅ Volume ${codigoBarras} validado com sucesso! Ainda restam ${totalPendentes} para escanear.`,
        finalizado: false
      };

      //mensagemBot = `✅ Volume dessa etiqueta é ${volc_plataforma_valor}!`;
      //return {
      //  sucesso: true,
      //  mensagem: mensagemBot,
      //  volcPlataforma: volc_plataforma_valor
      //};
    } else {
      mensagemBot = '❌ Código inválido ou não corresponde ao pedido.';
      return {
        sucesso: false,
        mensagem: mensagemBot,
        volcPlataforma: null
      };
    }

  } catch (err) {
    console.error("Erro na validação do volume (performVolumeValidation):", err);
    return {
      sucesso: false,
      mensagem: '❌ Ocorreu um erro interno ao validar o volume.',
      volcPlataforma: null
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Erro ao fechar a conexão do banco de dados:', err);
      }
    }
  }
}


// FUNÇÃO EXISTENTE: Valida Volume (usada pela rota HTTP)
// A função original 'validarVolume' precisa da linha abaixo se você quer
// que ela ainda envie a mensagem para o bot *além* de responder ao frontend.
// Se você só quer que a rota HTTP responda ao frontend e o bot responda apenas
// quando o usuário digita, você pode remover a parte de `mainBot.whatsappClient.sendMessage` daqui.
// Para manter a funcionalidade original (bot respondendo quando o scanner usa), mantenha a importação e o código.
const mainBot = require('../index'); // <--- Importa o módulo principal do bot para acessar o client
// Certifique-se de que o caminho '../index' está correto para o seu arquivo index.js do bot

async function validarVolume(req, res) {
  const { idPedido, codigoBarras, userId } = req.body;
  console.log('🟢 Chegou na função validarVolume (HTTP)');
  console.log('Body:', req.body);
  console.log('UserID recebido:', userId);

  // Chama a nova função core de validação
  const validationResult = await performVolumeValidation(codigoBarras, idPedido);

  // Envia a resposta HTTP para o frontend (a tela do scanner)
  res.json(validationResult);

  // Opcional: Se você ainda quer que o bot responda quando o scanner é usado
  // (além da resposta na tela do scanner), mantenha este bloco.
  // Caso contrário, pode remover se a resposta do bot for exclusiva para a digitação manual.
  //if (userId && mainBot.whatsappClient) {
  //    console.log(`🤖 Enviando mensagem para ${userId} (via HTTP handler): ${validationResult.mensagem}`);
  //    const contactId = userId;
  //    try {
  //        await mainBot.whatsappClient.sendMessage(contactId, validationResult.mensagem);
  //    } catch (error) {
  //        console.error('Erro ao enviar mensagem pelo bot (HTTP handler):', error);
  //    }
  //} else {
  //    console.warn('⚠️ Não foi possível enviar mensagem pelo bot (HTTP handler): userId ou whatsappClient não disponível.');
 // }
}

// Exporta AMBAS as funções: a que responde HTTP e a nova core
module.exports = { validarVolume, performVolumeValidation };