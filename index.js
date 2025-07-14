const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs-extra');
const path = require('path');

// Importar comandos
const menuCommand = require('./commands/menu');
const allCommand = require('./commands/all');
const adsCommands = require('./commands/ads');
const welcomeCommands = require('./commands/welcome');
const groupCommands = require('./commands/group');
const sorteioCommand = require('./commands/sorteio');
const horariosCommands = require('./commands/horarios');
const antilinkCommands = require('./commands/antilink');

// Utilitários
const { saveConfig, loadConfig } = require('./utils/config');
const { setupScheduledTasks } = require('./utils/scheduler');

// Logger configurado
const logger = P({ 
    level: 'silent',
    timestamp: () => `,"time":"${new Date().toLocaleString('pt-BR')}"` 
});

class WhatsAppBot {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryInterval = 10000; // 10 segundos
    }

    async initialize() {
        console.log('🤖 Iniciando Bot Administrador WhatsApp...');
        
        try {
            // Garantir que pasta de sessão existe
            await fs.ensureDir('./session');
            
            // Estado de autenticação multi-arquivo
            const { state, saveCreds } = await useMultiFileAuthState('./session');
            
            // Criar socket
            this.sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger)
                },
                logger,
                browser: Browsers.macOS('Desktop'),
                printQRInTerminal: false, // Evita QR Code
                generateHighQualityLinkPreview: true,
                markOnlineOnConnect: true
            });

            // Eventos de conexão
            this.sock.ev.on('connection.update', (update) => this.handleConnection(update));
            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('messages.upsert', (m) => this.handleMessages(m));
            this.sock.ev.on('messages.reaction', (reaction) => this.handleReactions(reaction));
            this.sock.ev.on('group-participants.update', (update) => this.handleGroupUpdate(update));
            
            // Configurar tarefas agendadas
            setupScheduledTasks(this.sock);
            
        } catch (error) {
            console.error('❌ Erro ao inicializar bot:', error);
            this.scheduleReconnect();
        }
    }

    async handleConnection(update) {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            this.isConnected = false;
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log('🔌 Conexão fechada devido a:', lastDisconnect?.error);
            
            if (shouldReconnect) {
                this.scheduleReconnect();
            } else {
                console.log('🚪 Desconectado permanentemente. Faça novo pareamento.');
                process.exit(0);
            }
        } else if (connection === 'open') {
            this.isConnected = true;
            this.retryCount = 0;
            console.log('✅ Bot conectado com sucesso!');
            console.log('📱 Pronto para administrar grupos!');
        }

        // Código de pareamento (8 dígitos)
        if (qr) {
            console.log('📱 Use o código de pareamento no WhatsApp:');
            const pairingCode = await this.sock.requestPairingCode('5511999999999'); // Substitua pelo seu número
            console.log(`🔑 Código: ${pairingCode}`);
        }
    }

    scheduleReconnect() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Tentativa de reconexão ${this.retryCount}/${this.maxRetries} em ${this.retryInterval/1000}s...`);
            
            setTimeout(() => {
                this.initialize();
            }, this.retryInterval);
        } else {
            console.log('❌ Máximo de tentativas excedido. Encerrando...');
            process.exit(1);
        }
    }

    async handleMessages(messageUpdate) {
        const { messages, type } = messageUpdate;
        
        if (type !== 'notify') return;
        
        for (const message of messages) {
            if (!message.message) continue;
            if (message.key.fromMe) continue; // Ignorar próprias mensagens
            
            const messageText = this.extractMessageText(message);
            if (!messageText || !messageText.startsWith('!')) continue;
            
            const fromJid = message.key.remoteJid;
            const isGroup = fromJid.endsWith('@g.us');
            
            if (!isGroup) continue; // Apenas grupos
            
            const senderId = message.key.participant || message.key.remoteJid;
            
            // Verificar se é admin (para comandos que precisam)
            const isAdmin = await this.isGroupAdmin(fromJid, senderId);
            
            // Processar comando
            await this.processCommand(messageText, message, fromJid, senderId, isAdmin);
        }
        
        // Verificar mensagens para sistema anti-link (apenas mensagens que não são comandos)
        for (const message of messages) {
            if (!message.message) continue;
            if (message.key.fromMe) continue;
            
            const messageText = this.extractMessageText(message);
            if (messageText && messageText.startsWith('!')) continue; // Pular comandos
            
            const fromJid = message.key.remoteJid;
            const isGroup = fromJid.endsWith('@g.us');
            
            if (!isGroup) continue;
            
            const senderId = message.key.participant || message.key.remoteJid;
            
            // Verificar se é admin (admins são isentos da moderação)
            const isAdmin = await this.isGroupAdmin(fromJid, senderId);
            if (isAdmin) continue;
            
            // Aplicar verificação anti-link
            await antilinkCommands.checkMessage(this.sock, message, fromJid, senderId);
        }
    }

    extractMessageText(message) {
        return (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            ''
        );
    }

    async isGroupAdmin(groupJid, userJid) {
        try {
            const groupMetadata = await this.sock.groupMetadata(groupJid);
            const participant = groupMetadata.participants.find(p => p.id === userJid);
            return participant?.admin === 'admin' || participant?.admin === 'superadmin';
        } catch {
            return false;
        }
    }

    async processCommand(text, message, groupJid, senderId, isAdmin) {
        const [command, ...args] = text.slice(1).split(' ');
        const fullArgs = args.join(' ');
        
        const context = {
            sock: this.sock,
            message,
            groupJid,
            senderId,
            isAdmin,
            args: fullArgs
        };

        try {
            switch (command.toLowerCase()) {
                case 'menu':
                    await menuCommand.execute(context);
                    break;
                
                case 'all':
                    if (!isAdmin) {
                        await this.sock.sendMessage(groupJid, { text: '🚫 Apenas administradores podem usar este comando!' });
                        return;
                    }
                    await allCommand.execute(context);
                    break;
                
                case 'addads':
                case 'listads':  
                case 'rmads':
                    if (!isAdmin) {
                        await this.sock.sendMessage(groupJid, { text: '🚫 Apenas administradores podem gerenciar anúncios!' });
                        return;
                    }
                    await adsCommands.execute(command, context);
                    break;
                
                case 'bv':
                case 'legendabv':
                    if (!isAdmin) {
                        await this.sock.sendMessage(groupJid, { text: '🚫 Apenas administradores podem configurar boas-vindas!' });
                        return;
                    }
                    await welcomeCommands.execute(command, context);
                    break;
                
                case 'abrirgrupo':
                case 'fechargrupo':
                case 'abrirgp':
                case 'fechargp':
                case 'afgp':
                    if (!isAdmin) {
                        await this.sock.sendMessage(groupJid, { text: '🚫 Apenas administradores podem controlar o grupo!' });
                        return;
                    }
                    await groupCommands.execute(command, context);
                    break;
                
                case 'sorteio':
                    if (!isAdmin) {
                        await this.sock.sendMessage(groupJid, { text: '🚫 Apenas administradores podem criar sorteios!' });
                        return;
                    }
                    await sorteioCommand.execute(context);
                    break;
                
                case 'horarios':
                case 'horapg':
                case 'addhorapg':
                    await horariosCommands.execute(command, context);
                    break;
                
                case 'banextremo':
                case 'banlinkgp':
                case 'antilinkgp':
                case 'antilink':
                case 'ban':
                    if (!isAdmin) {
                        await this.sock.sendMessage(groupJid, { text: '🚫 Apenas administradores podem usar comandos de moderação!' });
                        return;
                    }
                    await antilinkCommands.execute(command, context);
                    break;
            }
        } catch (error) {
            console.error('❌ Erro ao processar comando:', error);
            await this.sock.sendMessage(groupJid, { 
                text: '❌ Erro interno. Tente novamente em alguns segundos.' 
            });
        }
    }

    async handleReactions(reactionUpdate) {
        try {
            const { messages } = reactionUpdate;
            
            for (const reaction of messages) {
                if (!reaction.message?.reactionMessage) continue;
                
                const reactionData = {
                    key: reaction.message.reactionMessage.key,
                    emoji: reaction.message.reactionMessage.text,
                    participantJid: reaction.key.participant || reaction.key.remoteJid
                };
                
                // Processar reação para sorteios
                await sorteioCommand.handleReaction(this.sock, reactionData);
            }
        } catch (error) {
            console.error('❌ Erro ao processar reações:', error);
        }
    }

    async handleGroupUpdate(update) {
        // Gerenciar entradas/saídas do grupo para boas-vindas
        await welcomeCommands.handleGroupUpdate(update, this.sock);
    }
}

// Inicializar bot
const bot = new WhatsAppBot();
bot.initialize();

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', promise, 'Razão:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Encerrando bot...');
    process.exit(0);
});

module.exports = WhatsAppBot;