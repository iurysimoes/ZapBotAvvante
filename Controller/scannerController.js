const oracledb = require('oracledb');
const dbConfig = require('../ConfigDB');
const mainBot = require('../index'); // <--- Importa o módulo principal do bot para acessar o client

async function validarVolume(req, res) {
  //const { idPedido, codigoBarras } = req.body;
  const { idPedido, codigoBarras, userId } = req.body; // <--- Recebe o userId
  console.log('🟢 Chegou na função validarVolume');
  console.log('Body:', req.body);
  console.log('UserID recebido:', userId); // Para depuração

  let connection; // Declare connection outside try to ensure it's accessible in finally
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `select c.volc_plataforma
         from volume_conferencia c
        where c.volume_conferencia_id = :codigo`,
      {codigo: codigoBarras }
    );

    let mensagemBot = '';
    let volc_plataforma_valor = null;

    if (result.rows && result.rows.length > 0 && result.rows[0][0] !== null) {
      volc_plataforma_valor = result.rows[0][0];
      mensagemBot = `✅ Volume dessa etiqueta é ${volc_plataforma_valor}!`;
      res.json({
        sucesso: true,
        mensagem: mensagemBot, // Mantenha a mensagem para o frontend também
        volcPlataforma: volc_plataforma_valor
      });
    } else {
      mensagemBot = '❌ Código inválido ou não corresponde ao pedido.';
      res.json({
        sucesso: false,
        mensagem: mensagemBot,
        volcPlataforma: null
      });
    }

    // AGORA, ENVIE A MENSAGEM VIA BOT!
    if (userId && mainBot.whatsappClient) {
        console.log(`🤖 Enviando mensagem para ${userId}: ${mensagemBot}`);
        // Use o chat.id._serialized ou o número puro, dependendo do que o client.sendMessage espera
        // Normalmente, é o número com @c.us
        const contactId = userId; // Já vem no formato esperado
        await mainBot.whatsappClient.sendMessage(contactId, mensagemBot);
    } else {
        console.warn('⚠️ Não foi possível enviar mensagem pelo bot: userId ou whatsappClient não disponível.');
    }


  } catch (err) {
    console.error(err);
    const mensagemErroBot = '❌ Ocorreu um erro ao validar o volume.';
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao validar volume.', volcPlataforma: null });
    if (userId && mainBot.whatsappClient) {
        console.log(`🤖 Enviando mensagem de erro para ${userId}: ${mensagemErroBot}`);
        const contactId = userId;
        await mainBot.whatsappClient.sendMessage(contactId, mensagemErroBot);
    }
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

module.exports = { validarVolume };