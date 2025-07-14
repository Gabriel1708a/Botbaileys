/**
 * Sistema de Sorteios com Reações
 * Comando: !sorteio prêmio|tempo
 */

const { parseTimeToMs } = require('../utils/scheduler');

// Mapa para controlar sorteios ativos
const activeSorteios = new Map();

async function execute(context) {
    const { sock, groupJid, args } = context;
    
    try {
        if (!args || !args.includes('|')) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Formato incorreto!*

📝 *Uso correto:*
🎉 !sorteio prêmio|tempo

📋 *Exemplos:*
• !sorteio R$ 100|2m
• !sorteio iPhone 15|5m
• !sorteio Vale presente|1h

⏰ *Tempos válidos:*
• 1m = 1 minuto
• 5m = 5 minutos
• 1h = 1 hora` 
            });
            return;
        }
        
        const [prize, timeStr] = args.split('|').map(s => s.trim());
        
        if (!prize || !timeStr) {
            await sock.sendMessage(groupJid, { 
                text: '❌ Prêmio e tempo são obrigatórios!' 
            });
            return;
        }
        
        // Validar tempo
        const timeMs = parseTimeToMs(timeStr);
        if (!timeMs) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Tempo inválido!*

⏰ *Formatos válidos:*
• 1m (1 minuto)
• 5m (5 minutos)
• 30m (30 minutos)
• 1h (1 hora)` 
            });
            return;
        }
        
        // Verificar se já existe sorteio ativo no grupo
        if (activeSorteios.has(groupJid)) {
            await sock.sendMessage(groupJid, { 
                text: '⚠️ Já existe um sorteio ativo neste grupo! Aguarde terminar para criar outro.' 
            });
            return;
        }
        
        // Criar mensagem do sorteio
        const sorteioMessage = `🎉 *SORTEIO INICIADO!* 🎉

🏆 *Prêmio:* ${prize}
⏳ *Tempo:* ${timeStr}
✅ *Para participar:* Reaja com ✅

📊 *Como funciona:*
1️⃣ Clique na reação ✅ abaixo
2️⃣ Aguarde o tempo acabar
3️⃣ O vencedor será sorteado automaticamente

🍀 Boa sorte a todos! 🍀`;
        
        // Enviar mensagem do sorteio
        const sentMessage = await sock.sendMessage(groupJid, { text: sorteioMessage });
        const messageId = sentMessage.key.id;
        
        // Reagir com ✅ para exemplo
        await sock.sendMessage(groupJid, {
            react: {
                text: '✅',
                key: sentMessage.key
            }
        });
        
        // Salvar sorteio ativo
        const sorteioData = {
            messageId,
            messageKey: sentMessage.key,
            prize,
            timeStr,
            timeMs,
            startTime: Date.now(),
            endTime: Date.now() + timeMs,
            participants: new Set()
        };
        
        activeSorteios.set(groupJid, sorteioData);
        
        // Configurar timeout para finalizar sorteio
        setTimeout(async () => {
            await finalizeSorteio(sock, groupJid);
        }, timeMs);
        
        console.log(`🎉 Sorteio iniciado no grupo ${groupJid}: ${prize} (${timeStr})`);
        
    } catch (error) {
        console.error('❌ Erro ao criar sorteio:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao criar sorteio. Tente novamente.' 
        });
    }
}

/**
 * Processar reação em mensagem de sorteio
 */
async function handleReaction(sock, reaction) {
    try {
        const { key, emoji, participantJid } = reaction;
        
        if (emoji !== '✅') return; // Apenas reações com ✅
        
        const groupJid = key.remoteJid;
        const messageId = key.id;
        
        // Verificar se é um sorteio ativo
        const sorteioData = activeSorteios.get(groupJid);
        if (!sorteioData || sorteioData.messageId !== messageId) {
            return; // Não é uma mensagem de sorteio ativo
        }
        
        // Verificar se ainda está no tempo
        if (Date.now() > sorteioData.endTime) {
            return; // Sorteio já expirou
        }
        
        // Adicionar participante
        sorteioData.participants.add(participantJid);
        
        console.log(`✅ Participante adicionado ao sorteio ${groupJid}: ${participantJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao processar reação:', error);
    }
}

/**
 * Finalizar sorteio e sortear vencedor
 */
async function finalizeSorteio(sock, groupJid) {
    try {
        const sorteioData = activeSorteios.get(groupJid);
        if (!sorteioData) return;
        
        // Remover da lista de sorteios ativos
        activeSorteios.delete(groupJid);
        
        const participants = Array.from(sorteioData.participants);
        
        if (participants.length === 0) {
            await sock.sendMessage(groupJid, { 
                text: `😔 *SORTEIO FINALIZADO* 😔

🏆 *Prêmio:* ${sorteioData.prize}
👥 *Participantes:* 0

❌ Nenhum participante! O sorteio foi cancelado.

💡 *Próxima vez:* Reajam com ✅ para participar!` 
            });
            return;
        }
        
        // Sortear vencedor aleatório
        const winnerIndex = Math.floor(Math.random() * participants.length);
        const winnerJid = participants[winnerIndex];
        
        // Criar mensagem de resultado
        const resultMessage = `🎊 *SORTEIO FINALIZADO!* 🎊

🏆 *Prêmio:* ${sorteioData.prize}
👥 *Total de participantes:* ${participants.length}

🥳 *VENCEDOR:* @${winnerJid.split('@')[0]}

🎉 Parabéns! Entre em contato com um administrador para retirar seu prêmio!

✨ Obrigado a todos que participaram! ✨`;
        
        // Enviar resultado mencionando o vencedor
        await sock.sendMessage(groupJid, {
            text: resultMessage,
            mentions: [winnerJid]
        });
        
        console.log(`🏆 Sorteio finalizado no grupo ${groupJid}: Vencedor ${winnerJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao finalizar sorteio:', error);
        try {
            await sock.sendMessage(groupJid, { 
                text: '❌ Erro ao finalizar sorteio. Contate um administrador.' 
            });
        } catch (sendError) {
            console.error('❌ Erro ao enviar mensagem de erro:', sendError);
        }
    }
}

/**
 * Obter informações dos sorteios ativos
 */
function getActiveSorteios() {
    const result = {};
    for (const [groupJid, sorteioData] of activeSorteios.entries()) {
        result[groupJid] = {
            prize: sorteioData.prize,
            timeStr: sorteioData.timeStr,
            participantCount: sorteioData.participants.size,
            remainingTime: Math.max(0, sorteioData.endTime - Date.now()),
            startTime: sorteioData.startTime
        };
    }
    return result;
}

/**
 * Cancelar sorteio ativo (função administrativa)
 */
async function cancelSorteio(sock, groupJid) {
    try {
        const sorteioData = activeSorteios.get(groupJid);
        if (!sorteioData) {
            return false;
        }
        
        activeSorteios.delete(groupJid);
        
        await sock.sendMessage(groupJid, { 
            text: `🚫 *SORTEIO CANCELADO* 🚫

🏆 *Prêmio:* ${sorteioData.prize}
👥 *Participantes:* ${sorteioData.participants.size}

❌ O sorteio foi cancelado por um administrador.` 
        });
        
        console.log(`🚫 Sorteio cancelado no grupo ${groupJid}`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao cancelar sorteio:', error);
        return false;
    }
}

module.exports = { 
    execute,
    handleReaction,
    finalizeSorteio,
    getActiveSorteios,
    cancelSorteio
};