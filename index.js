
const qrcode = require('qrcode-terminal');
const express = require('express');
const oracledb = require('oracledb');
const dbConfig = require("./ConfigDB");

const funcoes = require('./funcoesGlobais');
const cliente = require('./Controller/clienteController')
const atendimento = require('./Controller/atendimentoController')
const unem = require('./Controller/unidadeController')

const { Client, Buttons, LocalAuth, MessageMedia } = require('whatsapp-web.js');

////////////////////////////////////////////////////////////////////////////////////
//////VERIAVEIS  GLOBAIS////////////////////////////////////////////////////////////
//>> Inicio ..Variaves globais do projeto devem esta declaradas aqui. Organização

var clientes = [];
let vCount = 0;
const userMenuState = {}; // Armazenar o estado de qual menu o usuário está

//>> FIM ..Variaves globais do projeto devem esta declaradas aqui. Organização
//////VERIAVEIS  GLOBAIS///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

const client = new Client({
    authStrategy: new LocalAuth()
});

// Exibe o QR code no terminal
client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});    
});
/* abaixo só descomentar para pegar alguns log caso apresente algum erro interno no client e nao
   esteja aparecendo nada visualmente no terminal...
client.on('qr', qr => console.log('QR Code recebido'));
client.on('authenticated', () => console.log('Autenticado'));
client.on('auth_failure', () => console.log('Falha na autenticação'));
client.on('ready', () => console.log('Cliente está pronto'));
client.on('disconnected', () => console.log('Cliente desconectado'));
*/
// Confirma que o cliente está pronto
client.on('ready', () => {
    console.log('Cliente está pronto!');

    // Função para enviar mensagem a cada 5 minutos (300000 ms)
    setInterval(() => {
        unem.enviarMsgCliente(client);  // Função que deve enviar a mensagem automaticamente
        //console.log('Envio de mensagem executado');
    }, 600000); // 10 minutos = 600000 milissegundos

});


// Função para mostrar o menu principal
const mostrarMenuPrincipal = (chat) => {
    // Carregar a imagem localmente
    //const media = MessageMedia.fromFilePath('logo.jpg');
    // Enviar a imagem
    //chat.sendMessage(media);

    const menu = `
     🔷  *REI DA FERRAGEM*  🔷

     Trabalhando por Bons Negocios


*MENU PRINCIPAL*
1️⃣ - Cliente
2️⃣ - Transportadora
3️⃣ - Falar com o atendimento

Por favor, responda com o número da opção desejada.
    `;

    chat.sendMessage(menu);
};

    // Ouve as mensagen message_create
    //client.on('message_create', async message => {
client.on('message', async msg => {
 //   console.log(message.from)
    const chat      = await msg.getChat();
    const body      = msg.body;
    const userId    = msg.from;  // ID do usuário que enviou a mensagem
    const nruserId  = msg.from.split('@')[0]; // Remove a parte do domínio    
    
//retirar depois
if (userId !== '556284315872@c.us') {
//if (userId !== '556281697636@c.us') {    marcio
//if (userId !== '556298369130@c.us') {   // murilo

   return; 
}
    // Se o usuário ainda não tem um estado de menu, exibe o menu principal
    if (!userMenuState[userId]) {
        userMenuState[userId] = 'main';  // Define o estado inicial do usuário como o menu principal
        //mostrarMenuPrincipal(chat);
        //return;  // Saída para evitar o processamento adicional        
    }

    const userState = userMenuState[userId];

    // Lógica do menu principal
    if (userState === 'main') {
        if (msg.body.toLowerCase() === 'menu') {
            mostrarMenuPrincipal(chat);
        } 
        else if (msg.body === '1') {
            chat.sendMessage('Cliente. Digite o CPF/CNPJ:');
            userMenuState[userId] = 'clienteCPF';  // Muda o estado do usuário para o menu cienteCPF
            //mostrarMenuCliente(chat);
        } 
        else if (msg.body === '2') {
            chat.sendMessage('Transportadora. Em Desenvolvimento.');
            return;
            //chat.sendMessage('Transportadora. Digite o CNPJ:');
            //userMenuState[userId] = 'transportadora';
        } 
        else if (msg.body === '3') {
            chat.sendMessage(`*Digite a mensagem para o atendimento:*`);
            userMenuState[userId] = 'atendimento';
        } 
        else {
            chat.sendMessage('Opção inválida. Envie "menu" para ver as opções.');
        }
    }
    else if (userState === 'clienteCPF') {
        
        //var CpfCnpj;
        //CpfCnpj = msg.body.replace(/[^\d]+/g, '');
        global.CpfCnpj = msg.body.replace(/[^\d]+/g, '');

       if (CpfCnpj.length !== 11 && CpfCnpj.length !== 14) {
          vCount = vCount+1; 
          if (vCount <= 3){
            chat.sendMessage(`CPF/CNPJ. Digitado inválido.Tentativa ${vCount} de 3. Digite o CPF/CNPJ: `);
            userMenuState[userId] = 'clienteCPF';  // Muda o estado do usuário para o menu cienteCPF
          }else {
            userMenuState[userId] = 'main'; // Muda o estado do usuário para o menu
            mostrarMenuPrincipal(chat);
          }
       }else{    
          if (CpfCnpj.length === 11) {
            if (funcoes.validarCPF(CpfCnpj)){
                userMenuState[userId] = 'cliente'; // Muda o estado do usuário para o menu cliente
                cliente.mostrarMenuCliente(chat);
            }else{
                chat.sendMessage(`CPF. Digitado inválido.`); 
                userMenuState[userId] = 'main'; // Muda o estado do usuário para o menu
                mostrarMenuPrincipal(chat);                
            }
          } 
          if (CpfCnpj.length === 14) {
            if (funcoes.validarCNPJ(CpfCnpj)){
                userMenuState[userId] = 'cliente';
                cliente.mostrarMenuCliente(chat);
            }else{
                chat.sendMessage(`CNPJ. Digitado inválido.`); 
                userMenuState[userId] = 'main'; // Muda o estado do usuário para o menu
                mostrarMenuPrincipal(chat);                
            }            
          }       
       }      
    }
    // Lógica do menu de cliente
    else if (userState === 'cliente') {    
        /*if (msg.body === '1') {
            chat.sendMessage('Aqui estão os Pedidos em Aberto: ...');
            await funcoes.sleep(1000);  // Pausa de 1 segundos
            cliente.mostrarCliPedido(chat);
            await funcoes.sleep(1000);  // Pausa de 1 segundos
            cliente.mostrarMenuCliente(chat);
         }*/ //comentado iury
         if (msg.body === '1') {
          chat.sendMessage('Aqui estão os Pedidos em Aberto: ...');
          await funcoes.sleep(1000);
          await cliente.mostrarCliPedido(chat, userId); // envia lista numerada e salva no estado
          userMenuState[userId] = 'escolherPedido'; // novo estado aguardando número do pedido
         }

        else if (msg.body === '2') {
            chat.sendMessage('Aqui estão Boletos em Aberto: ...');
            await funcoes.sleep(1000);  // Pausa de 1 segundos
            cliente.mostrarCliFinanceiro(chat);
            await funcoes.sleep(1000);  // Pausa de 1 segundos
            cliente.mostrarMenuCliente(chat);            
        } 
        else if (msg.body === '3') {
            chat.sendMessage(`*Digite a mensagem para o atendimento:*`);
            userMenuState[userId] = 'atendimento';

        } 
        else if (msg.body === '4') {
            userMenuState[userId] = 'main'; 
            mostrarMenuPrincipal(chat);  
        }         
        else {
            userMenuState[userId] = 'cliente';
            cliente.mostrarMenuCliente(chat);
        }
    }
    else if (userState === 'atendimento') {
        atendimento.gravarMsgAtendimento(chat,body,userId,nruserId);
        userMenuState[userId] = 'main'; 
        return;
    }/*inicio iury*/
    else if (userState === 'escolherPedido') {
      const escolha = parseInt(msg.body);
      const pedidos = global.listaPedidos?.[userId]; // pega os pedidos salvos para esse usuário

      if (!pedidos || isNaN(escolha) || escolha < 1 || escolha > pedidos.length) {
          chat.sendMessage('Opção inválida. Digite o número do pedido desejado.');
          return;
      }

      const pedido = pedidos[escolha - 1];
  
      // Mostra os detalhes do pedido escolhido
      // Guarda o ID do pedido no estado global (caso queira usar depois)
      global.pedidoSelecionado = pedido.NUMERO;

      // Mostra o novo menu baseado no pedido
      let menuEntrega = `📦 *Pedido ${pedido.NUMERO} selecionado.* O que deseja fazer?\n\n` +
                      `1️⃣ - Ler código de barras dos Volumes Recebidos?\n` +
                      `2️⃣ - Digitar código de barras dos Volumes Recebidos?\n` +
                      `3️⃣ - Confirmar Entrega Total dos Volumes Sem ler volumes?\n` +
                      `4️⃣ - Voltar ao Início.`;

       chat.sendMessage(menuEntrega);
       userMenuState[userId] = 'acaoEntrega';  // novo estado que você pode tratar depois
      }

    else if (userState === 'acaoEntrega') {
      switch (msg.body) {
        case '1':
        // Ajuste aqui: enviar link para a página scanner passando o pedido selecionado
        //const linkScanner = `http://SEU-IP-OU-DOMINIO:3000/scanner.html?idPedido=${global.pedidoSelecionado}`;
        //const ipLocal = '192.168.1.16'; // substitua pelo IP da sua máquina
        //{global.pedidoSelecionado}
        const linkScanner = `https://zap-bot-avvante.vercel.app/`;

        await chat.sendMessage('🔍 Abra o link abaixo para escanear o código de barras do volume:');
        await chat.sendMessage(linkScanner);
        break;

        case '2':
        chat.sendMessage('⌨️ Digite o código de barras manualmente:');
        userMenuState[userId] = 'digitarCodigo';
        break;

        case '3':
        chat.sendMessage('✅ Entrega total confirmada para o pedido ' + global.pedidoSelecionado);
        userMenuState[userId] = 'cliente';
        cliente.mostrarMenuCliente(chat);
        break;

        case '4':
        userMenuState[userId] = 'main';
        mostrarMenuPrincipal(chat);
        break;

        default:
        chat.sendMessage('❌ Opção inválida. Escolha de 1 a 4.');
    }
}

/*fim iury*/
 
});


// Start your client
//client.initialize();

/*inicio iury*/
//const scannerController = require('./Controller/scannerController'); 
const scannerController = require('./Controller/scannerController');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve HTML e JS

app.post('/validar-volume', scannerController.validarVolume);

app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando na porta 3000!');
});


/*fim iury */
//console.log('Iniciando WhatsApp client...');
// Start your client
client.initialize();