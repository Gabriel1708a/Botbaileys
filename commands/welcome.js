/**
 * Sistema de Boas-vindas
 * Comandos: !bv, !legendabv
 */

const { saveConfig, loadConfig, getConfig } = require('../utils/config');

async function execute(command, context) {
    const { sock, groupJid, args } = context;
    
    switch (command.toLowerCase()) {
        case 'bv':
            await toggleWelcome(sock, groupJid, args);
            break;
        case 'legendabv':
            await setWelcomeMessage(sock, groupJid, args);
            break;
        default:
            await sock.sendMessage(groupJid, { 
                text: '❌ Comando de boas-vindas não reconhecido.' 
            });
    }
}

/**
 * Ativar/desativar boas-vindas
 * Formato: !bv 1 ou !bv 0
 */
async function toggleWelcome(sock, groupJid, args) {
    try {
        if (!args || (args !== '1' && args !== '0')) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Formato incorreto!*

📝 *Uso correto:*
🎉 !bv 1 - Ativar boas-vindas
🚫 !bv 0 - Desativar boas-vindas

💡 *Configurar mensagem:*
🙌 !legendabv sua mensagem aqui` 
            });
            return;
        }
        
        const isActive = args === '1';
        
        // Salvar configuração
        await saveConfig(groupJid, 'welcomeActive', isActive);
        
        const statusText = isActive ? '🟢 Ativadas' : '🔴 Desativadas';
        const emoji = isActive ? '🎉' : '🚫';
        
        let responseText = `${emoji} *Boas-vindas ${statusText}!*\n\n`;
        
        if (isActive) {
            // Mostrar mensagem atual
            const currentMessage = await getConfig(groupJid, 'welcomeMessage', 
                'Bem-vindo(a) @user ao grupo @group! 🎉👋');
            
            responseText += `💬 *Mensagem atual:*\n${currentMessage}\n\n`;
            responseText += `💡 Para personalizar:\n🙌 !legendabv sua mensagem\n\n`;
            responseText += `🔧 *Variáveis disponíveis:*\n`;
            responseText += `• @user - menciona o novo membro\n`;
            responseText += `• @group - nome do grupo`;
        } else {
            responseText += `💭 As boas-vindas não serão mais enviadas automaticamente.`;
        }
        
        await sock.sendMessage(groupJid, { text: responseText });
        
        console.log(`👋 Boas-vindas ${isActive ? 'ativadas' : 'desativadas'} no grupo ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar boas-vindas:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao configurar boas-vindas. Tente novamente.' 
        });
    }
}

/**
 * Definir mensagem de boas-vindas personalizada
 * Formato: !legendabv mensagem personalizada
 */
async function setWelcomeMessage(sock, groupJid, args) {
    try {
        if (!args || args.trim().length === 0) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Mensagem obrigatória!*

📝 *Uso correto:*
🙌 !legendabv sua mensagem aqui

🔧 *Variáveis disponíveis:*
• @user - menciona o novo membro
• @group - nome do grupo

📋 *Exemplos:*
• !legendabv Olá @user! Bem-vindo ao @group 🎉
• !legendabv @user entrou no melhor grupo: @group! 👋
• !legendabv Seja bem-vindo @user! Leia as regras do @group 📋` 
            });
            return;
        }
        
        const customMessage = args.trim();
        
        // Salvar mensagem personalizada
        await saveConfig(groupJid, 'welcomeMessage', customMessage);
        
        // Ativar boas-vindas automaticamente se não estiver ativo
        const isActive = await getConfig(groupJid, 'welcomeActive', false);
        if (!isActive) {
            await saveConfig(groupJid, 'welcomeActive', true);
        }
        
        await sock.sendMessage(groupJid, { 
            text: `✅ *Mensagem de boas-vindas configurada!*

💬 *Nova mensagem:*
${customMessage}

🎉 *Status:* Ativado automaticamente

🔧 *Variáveis usadas:*
• @user - menciona o novo membro
• @group - nome do grupo

💡 Para desativar: !bv 0` 
        });
        
        console.log(`🙌 Mensagem de boas-vindas configurada no grupo ${groupJid}: ${customMessage}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar mensagem de boas-vindas:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao configurar mensagem. Tente novamente.' 
        });
    }
}

/**
 * Lidar com atualizações de participantes do grupo
 */
async function handleGroupUpdate(update, sock) {
    try {
        const { id: groupJid, participants, action } = update;
        
        if (action !== 'add') return; // Apenas novos membros
        
        // Verificar se boas-vindas estão ativas
        const isActive = await getConfig(groupJid, 'welcomeActive', false);
        if (!isActive) return;
        
        // Obter mensagem personalizada
        const welcomeMessage = await getConfig(groupJid, 'welcomeMessage', 
            'Bem-vindo(a) @user ao grupo @group! 🎉👋');
        
        // Obter metadados do grupo
        const groupMetadata = await sock.groupMetadata(groupJid);
        const groupName = groupMetadata.subject;
        
        // Processar cada novo membro
        for (const participantJid of participants) {
            try {
                // Processar variáveis na mensagem
                let processedMessage = welcomeMessage
                    .replace(/@group/g, groupName)
                    .replace(/@user/g, `@${participantJid.split('@')[0]}`);
                
                // Enviar mensagem de boas-vindas
                await sock.sendMessage(groupJid, {
                    text: processedMessage,
                    mentions: [participantJid]
                });
                
                console.log(`👋 Boas-vindas enviadas para ${participantJid} no grupo ${groupJid}`);
                
            } catch (memberError) {
                console.error(`❌ Erro ao enviar boas-vindas para ${participantJid}:`, memberError);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar entrada de membros:', error);
    }
}

module.exports = { 
    execute,
    handleGroupUpdate 
};