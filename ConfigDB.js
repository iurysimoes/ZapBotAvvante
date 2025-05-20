

require("dotenv").config();
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_CONSTRING = process.env.DB_CONSTRING;

  const oracledb = require("oracledb");

   try {

   /* #Variavel Ambiente
       Nomeie a variável como ORACLE_LIB_DIR e defina o caminho para o diretório do Oracle Client. Exemplo:
       
       Nome: ORACLE_LIB_DIR 
       Caminho: C:\oraclexe\app\oracle\product\11.2.0\server\bin
    */

   //oracledb.initOracleClient({libDir: "C:\\OracleCL_64bits\\product\\11.2.0\\client_1\\bin"});
   //oracledb.initOracleClient({libDir: "C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin"});
   //oracledb.initOracleClient({libDir: process.env.ORACLE_LIB_DIR});
   //oracledb.initOracleClient({libDir: "instantclient_21_3/"});
   oracledb.initOracleClient({ libDir: "C:/oracle/instantclient_21_3" });


    } catch (err) {
      console.error('Erro no Client!');
      console.error(err);
      process.exit(1);
   } 
 
const dbConfig = {  
    user : DB_USER,
    password : DB_PASSWORD,
    connectString :DB_CONSTRING
   }

   module.exports = dbConfig;
   
