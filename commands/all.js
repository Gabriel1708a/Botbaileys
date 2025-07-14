/**
 * Comando !all - Marcação silenciosa de todos os membros
 */

async function execute(context) {
    const { sock, groupJid, message } = context;
    
    try {
        // Obter metadados do grupo
        const groupMetadata = await sock.groupMetadata(groupJid);
        const participants = groupMetadata.participants;
        
        if (!participants || participants.length === 0) {
            await sock.sendMessage(groupJid, { 
                text: '❌ Não foi possível obter a lista de membros do grupo.' 
            });
            return;
        }
        
        // Extrair mensagem adicional do comando (se houver)
        const messageText = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || '';
        const [, ...messageParts] = messageText.split(' ');
        const additionalMessage = messageParts.join(' ');
        
        // Criar lista de menções (apenas IDs)
        const mentions = participants.map(p => p.id);
        
        // Texto da mensagem
        let responseText = '📣 *ATENÇÃO GERAL* 📣\n\n';
        
        if (additionalMessage) {
            responseText += `💬 ${additionalMessage}\n\n`;
        }
        
        responseText += `👥 *${mentions.length} membros mencionados silenciosamente*\n\n`;
        responseText += '🔔 Todos foram notificados!';
        
        // Enviar mensagem com menções silenciosas
        await sock.sendMessage(groupJid, {
            text: responseText,
            mentions: mentions
        });
        
        console.log(`📣 Comando !all executado no grupo ${groupJid} - ${mentions.length} membros mencionados`);
        
    } catch (error) {
        console.error('❌ Erro ao executar comando !all:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro ao mencionar membros. Verifique se o bot tem as permissões necessárias.' 
        });
    }
}

module.exports = { execute };