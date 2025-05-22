const oracledb = require('oracledb');
const dbConfig = require('../ConfigDB');

async function validarVolume(req, res) {
  const { idPedido, codigoBarras } = req.body;
  //console.log('Requisição recebida com:', req.body);

  //console.log('Resultado da consulta:', result.rows);
 

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `select c.volc_plataforma 
         from volume_conferencia c 
        where c.volume_conferencia_id = :codigo`,
      {codigo: idPedido }
    );

    await connection.close();

    if (result.rows[0][0] > 0) {
      res.json({ sucesso: true, mensagem: '✅ Código de barras válido!' });
    } else {
      res.json({ sucesso: false, mensagem: '❌ Código inválido ou não corresponde ao pedido.' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao validar volume.' });
  }
}

module.exports = { validarVolume };
