const qrcode = require('qrcode-terminal');
const express = require('express');
const oracledb = require('oracledb');
const dbConfig = require("./ConfigDB");

const funcoes = require('./funcoesGlobais');
const cliente = require('./Controller/clienteController');
const atendimento = require('./Controller/atendimentoController');
const unem = require('./Controller/unidadeController');
// Mover a importação do scannerController para o topo, junto com as outras imports
const scannerController = require('./Controller/scannerController'); // Importar o scannerController

const { Client, Buttons, LocalAuth, MessageMedia } = require('whatsapp-web.js');

////////////////////////////////////////////////////////////////////////////////////
//////VERIAVEIS  GLOBAIS////////////////////////////////////////////////////////////
//>> Inicio ..Variaves globais do projeto devem esta declaradas aqui. Organização

var clientes = [];
let vCount = 0;
const userMenuState = {}; // Armazenar o estado de qual menu o usuário está
// ATENÇÃO: global.pedidoSelecionado é uma variável global que deve ser gerenciada
// para garantir que o pedido certo esteja associado ao usuário correto.
// Se múltiplos usuários usam o bot simultaneamente, considere um mapeamento
// userPedido[userId] = idPedido para maior robustez.

//>> FIM ..Variaves globais do projeto devem esta declaradas aqui. Organização
//////VERIAVEIS  GLOBAIS///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

const client = new Client({
    authStrategy: new LocalAuth()
});
// Exponha o client do WhatsApp para outros módulos
module.exports.whatsappClient = client;

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
     🔷  *REI DA FERRAGEM* 🔷

     Trabalhando por Bons Negocios


*MENU PRINCIPAL*
1️⃣ - Cliente
2️⃣ - Transportadora
3️⃣ - Falar com o atendimento

Por favor, responda com o número da opção desejada.
    `;

    chat.sendMessage(menu);
};

// Ouve as mensagens
client.on('message', async msg => {
    const chat = await msg.getChat();
    const body = msg.body;
    const userId = msg.from;   // ID do usuário que enviou a mensagem
    const nruserId = msg.from.split('@')[0]; // Remove a parte do domínio

    // FILTRO DE USUÁRIO (APENAS PARA TESTE, RETIRAR EM PRODUÇÃO)
    if (userId !== '556284315872@c.us') { // Mantenha ou remova conforme sua necessidade de teste
        return;
    }

    // Se o usuário ainda não tem um estado de menu, define o estado inicial como o menu principal
    if (!userMenuState[userId]) {
        userMenuState[userId] = 'main';
        //mostrarMenuPrincipal(chat); // Você pode querer chamar isso aqui para iniciar a conversa
        //return; // Se você chamar mostrarMenuPrincipal aqui e retornar, ele não processará a primeira mensagem como opção
    }

    const userState = userMenuState[userId];

    // --- LÓGICA PRINCIPAL DE TRATAMENTO DE MENSAGENS ---

    // 1. PRIMEIRO: Verifique se o usuário está em um estado que espera uma entrada específica (ex: código de barras)
    if (userState === 'digitarCodigo') {
        const codigoBarrasDigitado = msg.body;
        // idPedidoAtual deve ser o ID do pedido que o usuário selecionou anteriormente
        // global.pedidoSelecionado precisa estar definido neste ponto.
        const idPedidoAtual = global.pedidoSelecionado;

        console.log(`Recebido código de barras digitado: ${codigoBarrasDigitado} para Pedido: ${idPedidoAtual}`);

        // Chama a função de validação de volume do scannerController (performVolumeValidation)
        // **Certifique-se de que scannerController.performVolumeValidation está exportada em scannerController.js**
        const validationResult = await scannerController.performVolumeValidation(codigoBarrasDigitado, idPedidoAtual);

        // Envia a resposta de volta ao usuário do WhatsApp
        await chat.sendMessage(validationResult.mensagem);

        // Resetar o estado do usuário para o menu 'acaoEntrega' ou 'main' após processar
        userMenuState[userId] = 'acaoEntrega'; // Volta para o menu de ações do pedido
        // Reexibir o menu de ações da entrega para o usuário
        let menuEntrega = `📦 *Pedido ${idPedidoAtual} selecionado.* O que deseja fazer?\n\n` +
                         `1️⃣ - Ler código de barras dos Volumes Recebidos?\n` +
                         `2️⃣ - Digitar código de barras dos Volumes Recebidos?\n` +
                         `3️⃣ - Confirmar Entrega Total dos Volumes Sem ler volumes?\n` +
                         `4️⃣ - Voltar ao Início.`;
        //chat.sendMessage(menuEntrega);

    }
    // 2. SEGUNDO: Se o usuário NÃO está em um estado de espera de entrada, então ele está navegando pelos menus.
    else if (userState === 'main') {
        if (msg.body.toLowerCase() === 'menu') {
            mostrarMenuPrincipal(chat);
        }
        else if (msg.body === '1') {
            chat.sendMessage('Cliente. Digite o CPF/CNPJ:');
            userMenuState[userId] = 'clienteCPF';
        }
        else if (msg.body === '2') {
            chat.sendMessage('Transportadora. Em Desenvolvimento.');
            // userMenuState[userId] = 'transportadora'; // Descomente e implemente se for usar
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
        global.CpfCnpj = msg.body.replace(/[^\d]+/g, '');

        if (global.CpfCnpj.length !== 11 && global.CpfCnpj.length !== 14) {
            vCount = vCount + 1;
            if (vCount <= 3) {
                chat.sendMessage(`CPF/CNPJ. Digitado inválido. Tentativa ${vCount} de 3. Digite o CPF/CNPJ: `);
                userMenuState[userId] = 'clienteCPF';
            } else {
                chat.sendMessage('Número de tentativas excedido. Voltando ao menu principal.');
                userMenuState[userId] = 'main';
                mostrarMenuPrincipal(chat);
                vCount = 0; // Resetar contador
            }
        } else {
            if (global.CpfCnpj.length === 11) {
                if (funcoes.validarCPF(global.CpfCnpj)) {
                    userMenuState[userId] = 'cliente';
                    cliente.mostrarMenuCliente(chat);
                    vCount = 0; // Resetar contador
                } else {
                    chat.sendMessage(`CPF. Digitado inválido.`);
                    userMenuState[userId] = 'main';
                    mostrarMenuPrincipal(chat);
                    vCount = 0; // Resetar contador
                }
            }
            if (global.CpfCnpj.length === 14) {
                if (funcoes.validarCNPJ(global.CpfCnpj)) {
                    userMenuState[userId] = 'cliente';
                    cliente.mostrarMenuCliente(chat);
                    vCount = 0; // Resetar contador
                } else {
                    chat.sendMessage(`CNPJ. Digitado inválido.`);
                    userMenuState[userId] = 'main';
                    mostrarMenuPrincipal(chat);
                    vCount = 0; // Resetar contador
                }
            }
        }
    }
    else if (userState === 'cliente') {
        if (msg.body === '1') {
            chat.sendMessage('Aqui estão os Pedidos em Aberto: ...');
            await funcoes.sleep(1000);
            await cliente.mostrarCliPedido(chat, userId);
            userMenuState[userId] = 'escolherPedido';
        }
        else if (msg.body === '2') {
            chat.sendMessage('Aqui estão Boletos em Aberto: ...');
            await funcoes.sleep(1000);
            cliente.mostrarCliFinanceiro(chat);
            await funcoes.sleep(1000);
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
        atendimento.gravarMsgAtendimento(chat, body, userId, nruserId);
        userMenuState[userId] = 'main';
        mostrarMenuPrincipal(chat); // Volta para o menu principal após o atendimento
    }
    else if (userState === 'escolherPedido') {
        const escolha = parseInt(msg.body);
        const pedidos = global.listaPedidos?.[userId]; // pega os pedidos salvos para esse usuário

        if (!pedidos || isNaN(escolha) || escolha < 1 || escolha > pedidos.length) {
            chat.sendMessage('Opção inválida. Digite o número do pedido desejado.');
            return;
        }

        const pedido = pedidos[escolha - 1];

        // Guarda o ID do pedido no estado global (caso queira usar depois)
        global.pedidoSelecionado = pedido.NUMERO;

        // Mostra o novo menu baseado no pedido
        let menuEntrega = `📦 *Pedido ${pedido.NUMERO} selecionado.* O que deseja fazer?\n\n` +
                         `1️⃣ - Ler código de barras dos Volumes Recebidos?\n` +
                         `2️⃣ - Digitar código de barras dos Volumes Recebidos?\n` +
                         `3️⃣ - Confirmar Entrega Total dos Volumes Sem ler volumes?\n` +
                         `4️⃣ - Voltar ao Início.`;

        chat.sendMessage(menuEntrega);
        userMenuState[userId] = 'acaoEntrega';
    }
    else if (userState === 'acaoEntrega') {
        switch (msg.body) {
            case '1': // Opção para ir para o scanner (frontend)
                const userIdForLink = chat.id._serialized;
                const linkScanner = `https://zap-bot-avvante.vercel.app/?idPedido=${global.pedidoSelecionado}&userId=${userIdForLink}`;

                await chat.sendMessage('🔍 Abra o link abaixo para escanear o código de barras do volume:');
                await chat.sendMessage(linkScanner);

                // ATENÇÃO: Removi a chamada imediata ao cliente.mostrarMenuCliente(chat) e
                // o reset de userMenuState para 'cliente' aqui.
                // O bot não deve responder imediatamente após enviar o link.
                // Ele só notificará o usuário quando a conferência *completa* for finalizada via scannerController.
                userMenuState[userIdForLink] = 'acaoEntrega'; // Mantém no estado de ações do pedido

                // Se desejar um prompt silencioso para o usuário no chat, pode ser:
                // chat.sendMessage('Aguardando escaneamento dos volumes...');
                break;

            case '2': // Opção para digitar código de barras
                chat.sendMessage('⌨️ Digite o código de barras manualmente:');
                userMenuState[userId] = 'digitarCodigo'; // Define o estado para esperar a entrada do código
                break;

            case '3': // Confirmar Entrega Total
                // Implementar a lógica de confirmação de entrega total aqui
                // (pode fazer um UPDATE em todos os volumes pendentes para 'S')
                chat.sendMessage('✅ Confirmando entrega total...');
                // Exemplo de como você poderia chamar uma função para isso:
                // await scannerController.confirmarEntregaTotal(global.pedidoSelecionado, userId);
                chat.sendMessage('✅ Entrega total confirmada para o pedido ' + global.pedidoSelecionado);
                userMenuState[userId] = 'cliente'; // Ou para o menu principal
                cliente.mostrarMenuCliente(chat);
                break;

            case '4': // Voltar ao Início
                userMenuState[userId] = 'main';
                mostrarMenuPrincipal(chat);
                break;

            default:
                chat.sendMessage('❌ Opção inválida. Escolha de 1 a 4.');
                // Reexibir o menu de ações da entrega para o usuário
                let menuEntrega = `📦 *Pedido ${global.pedidoSelecionado} selecionado.* O que deseja fazer?\n\n` +
                                 `1️⃣ - Ler código de barras dos Volumes Recebidos?\n` +
                                 `2️⃣ - Digitar código de barras dos Volumes Recebidos?\n` +
                                 `3️⃣ - Confirmar Entrega Total dos Volumes Sem ler volumes?\n` +
                                 `4️⃣ - Voltar ao Início.`;
                chat.sendMessage(menuEntrega);
        }
    }
    // --- FIM DA LÓGICA PRINCIPAL ---
});

// Setup do Express para o backend (HTTP server)
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve HTML e JS (garanta que seu index.html está na pasta 'public')

// Rota HTTP para validação de volume pelo scanner
console.log('Entrou index.jss');
app.post('/validar-volume', scannerController.validarVolume);
console.log('passou pela chamada scannerController');

app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor Express rodando na porta 3000!');
});

// Inicializa o cliente do WhatsApp
client.initialize();