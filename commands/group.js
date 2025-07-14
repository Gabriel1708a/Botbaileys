/**
 * Sistema de Controle de Grupo
 * Comandos: !abrirgrupo, !fechargrupo, !abrirgp, !fechargp, !afgp
 */

const { saveSchedulesData, loadSchedulesData } = require('../utils/config');

async function execute(command, context) {
    const { sock, groupJid, args } = context;
    
    switch (command.toLowerCase()) {
        case 'abrirgrupo':
            await openGroup(sock, groupJid);
            break;
        case 'fechargrupo':
            await closeGroup(sock, groupJid);
            break;
        case 'abrirgp':
            await scheduleOpenGroup(sock, groupJid, args);
            break;
        case 'fechargp':
            await scheduleCloseGroup(sock, groupJid, args);
            break;
        case 'afgp':
            await cancelSchedule(sock, groupJid, args);
            break;
        default:
            await sock.sendMessage(groupJid, { 
                text: '❌ Comando de grupo não reconhecido.' 
            });
    }
}

/**
 * Abrir grupo manualmente
 */
async function openGroup(sock, groupJid) {
    try {
        await sock.groupSettingUpdate(groupJid, 'not_announcement');
        
        await sock.sendMessage(groupJid, { 
            text: `🔓 *GRUPO ABERTO!* 🔓

📱 Todos os membros podem enviar mensagens agora!
💬 Conversem à vontade!

🤖 _Comando executado manualmente_` 
        });
        
        console.log(`🔓 Grupo aberto manualmente: ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao abrir grupo:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro ao abrir grupo. Verifique se o bot tem permissões de administrador.' 
        });
    }
}

/**
 * Fechar grupo manualmente
 */
async function closeGroup(sock, groupJid) {
    try {
        await sock.groupSettingUpdate(groupJid, 'announcement');
        
        await sock.sendMessage(groupJid, { 
            text: `🔐 *GRUPO FECHADO!* 🔐

👥 Apenas administradores podem enviar mensagens.
🔇 Membros comuns não podem mais conversar.

🤖 _Comando executado manualmente_` 
        });
        
        console.log(`🔐 Grupo fechado manualmente: ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao fechar grupo:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro ao fechar grupo. Verifique se o bot tem permissões de administrador.' 
        });
    }
}

/**
 * Agendar abertura do grupo
 * Formato: !abrirgp HH:MM
 */
async function scheduleOpenGroup(sock, groupJid, args) {
    try {
        if (!args || !isValidTime(args)) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Formato de horário inválido!*

📝 *Uso correto:*
⏰ !abrirgp HH:MM

📋 *Exemplos:*
• !abrirgp 09:00
• !abrirgp 14:30
• !abrirgp 20:00

🕐 Use formato 24h (00:00 até 23:59)` 
            });
            return;
        }
        
        const time = args.trim();
        
        // Carregar agendamentos existentes
        const schedulesData = await loadSchedulesData();
        if (!schedulesData[groupJid]) {
            schedulesData[groupJid] = {};
        }
        
        // Salvar agendamento de abertura
        schedulesData[groupJid].openTime = time;
        await saveSchedulesData(schedulesData);
        
        await sock.sendMessage(groupJid, { 
            text: `✅ *Abertura Agendada!* ✅

⏰ *Horário:* ${time}
🔓 *Ação:* Abrir grupo automaticamente
🗓️ *Frequência:* Todos os dias
🌎 *Fuso:* America/Sao_Paulo

📱 O grupo será aberto automaticamente no horário definido!

💡 Para cancelar: !afgp 0` 
        });
        
        console.log(`⏰ Abertura agendada para ${groupJid} às ${time}`);
        
    } catch (error) {
        console.error('❌ Erro ao agendar abertura:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao agendar abertura. Tente novamente.' 
        });
    }
}

/**
 * Agendar fechamento do grupo
 * Formato: !fechargp HH:MM
 */
async function scheduleCloseGroup(sock, groupJid, args) {
    try {
        if (!args || !isValidTime(args)) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Formato de horário inválido!*

📝 *Uso correto:*
⏰ !fechargp HH:MM

📋 *Exemplos:*
• !fechargp 22:00
• !fechargp 01:30
• !fechargp 23:59

🕐 Use formato 24h (00:00 até 23:59)` 
            });
            return;
        }
        
        const time = args.trim();
        
        // Carregar agendamentos existentes
        const schedulesData = await loadSchedulesData();
        if (!schedulesData[groupJid]) {
            schedulesData[groupJid] = {};
        }
        
        // Salvar agendamento de fechamento
        schedulesData[groupJid].closeTime = time;
        await saveSchedulesData(schedulesData);
        
        await sock.sendMessage(groupJid, { 
            text: `✅ *Fechamento Agendado!* ✅

⏰ *Horário:* ${time}
🔐 *Ação:* Fechar grupo automaticamente
🗓️ *Frequência:* Todos os dias
🌎 *Fuso:* America/Sao_Paulo

🔒 O grupo será fechado automaticamente no horário definido!

💡 Para cancelar: !afgp 0` 
        });
        
        console.log(`⏰ Fechamento agendado para ${groupJid} às ${time}`);
        
    } catch (error) {
        console.error('❌ Erro ao agendar fechamento:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao agendar fechamento. Tente novamente.' 
        });
    }
}

/**
 * Cancelar agendamentos
 * Formato: !afgp 0
 */
async function cancelSchedule(sock, groupJid, args) {
    try {
        if (args !== '0') {
            // Mostrar agendamentos atuais
            await showCurrentSchedules(sock, groupJid);
            return;
        }
        
        // Carregar agendamentos
        const schedulesData = await loadSchedulesData();
        
        if (!schedulesData[groupJid] || 
            (!schedulesData[groupJid].openTime && !schedulesData[groupJid].closeTime)) {
            await sock.sendMessage(groupJid, { 
                text: `ℹ️ *Nenhum Agendamento Ativo*

🔍 Não há agendamentos configurados para este grupo.

💡 Para agendar:
⏰ !abrirgp HH:MM - Agendar abertura
⏰ !fechargp HH:MM - Agendar fechamento` 
            });
            return;
        }
        
        // Salvar estado dos agendamentos
        const hadOpen = !!schedulesData[groupJid].openTime;
        const hadClose = !!schedulesData[groupJid].closeTime;
        
        // Remover agendamentos
        delete schedulesData[groupJid];
        await saveSchedulesData(schedulesData);
        
        let responseText = '✅ *Agendamentos Cancelados!* ✅\n\n';
        responseText += '🚫 *Cancelados:*\n';
        
        if (hadOpen) {
            responseText += '• ⏰ Abertura automática\n';
        }
        if (hadClose) {
            responseText += '• ⏰ Fechamento automático\n';
        }
        
        responseText += '\n🔧 O grupo agora só será controlado manualmente.';
        
        await sock.sendMessage(groupJid, { text: responseText });
        
        console.log(`🚫 Agendamentos cancelados para ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao cancelar agendamentos:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao cancelar agendamentos. Tente novamente.' 
        });
    }
}

/**
 * Mostrar agendamentos atuais
 */
async function showCurrentSchedules(sock, groupJid) {
    try {
        const schedulesData = await loadSchedulesData();
        const groupSchedules = schedulesData[groupJid] || {};
        
        let responseText = '📅 *AGENDAMENTOS ATUAIS* 📅\n\n';
        
        if (groupSchedules.openTime) {
            responseText += `🔓 *Abertura:* ${groupSchedules.openTime}\n`;
        }
        
        if (groupSchedules.closeTime) {
            responseText += `🔐 *Fechamento:* ${groupSchedules.closeTime}\n`;
        }
        
        if (!groupSchedules.openTime && !groupSchedules.closeTime) {
            responseText += '🔍 Nenhum agendamento ativo.\n\n';
            responseText += '💡 Para agendar:\n';
            responseText += '⏰ !abrirgp HH:MM\n';
            responseText += '⏰ !fechargp HH:MM';
        } else {
            responseText += '\n🌎 *Fuso:* America/Sao_Paulo\n';
            responseText += '🗓️ *Frequência:* Diária\n\n';
            responseText += '🚫 Para cancelar: !afgp 0';
        }
        
        await sock.sendMessage(groupJid, { text: responseText });
        
    } catch (error) {
        console.error('❌ Erro ao mostrar agendamentos:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro ao carregar agendamentos.' 
        });
    }
}

/**
 * Validar formato de tempo (HH:MM)
 */
function isValidTime(timeStr) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
}

module.exports = { execute };