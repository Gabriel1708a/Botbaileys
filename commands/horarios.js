/**
 * Sistema de Horários Pagantes (Simulador de Apostas)
 * Comandos: !horarios, !horapg, !addhorapg
 */

const { saveHorariosData, loadHorariosData, isGroupActive } = require('../utils/config');
const { setupHorariosInterval, removeHorariosInterval, parseTimeToMs } = require('../utils/scheduler');

async function execute(command, context) {
    const { sock, groupJid, args } = context;
    
    switch (command.toLowerCase()) {
        case 'horarios':
            await sendHorarioPagante(sock, groupJid);
            break;
        case 'horapg':
            await toggleHorariosPagantes(sock, groupJid, args);
            break;
        case 'addhorapg':
            await setHorariosInterval(sock, groupJid, args);
            break;
        default:
            await sock.sendMessage(groupJid, { 
                text: '❌ Comando de horários não reconhecido.' 
            });
    }
}

/**
 * Enviar horário pagante manual
 */
async function sendHorarioPagante(sock, groupJid) {
    try {
        // Verificar se grupo está ativo
        if (!(await isGroupActive(groupJid))) {
            await sock.sendMessage(groupJid, { 
                text: '⚠️ Funcionalidade disponível apenas para grupos ativos.' 
            });
            return;
        }
        
        const horarioSugestao = generateRandomTime();
        const multiplier = generateRandomMultiplier();
        const platform = getRandomPlatform();
        
        const message = `🍀 *HORÁRIO PAGANTE* 🍀

💰 *Plataforma:* ${platform}
⏰ *Melhor horário:* ${horarioSugestao}
🎯 *Multiplicador estimado:* ${multiplier}x
📈 *Chance de green:* ${generateRandomChance()}%

🔥 *ESTRATÉGIA SUGERIDA:*
💸 Aposte com valor baixo
🎲 Foque em multiplicadores médios
⚡ Aproveite o momentum do horário

🎰 Boa sorte! 🍀

⚠️ _Lembre-se: apostas envolvem riscos. Jogue com responsabilidade!_`;
        
        await sock.sendMessage(groupJid, { text: message });
        
        console.log(`🕐 Horário pagante manual enviado para ${groupJid}: ${horarioSugestao}`);
        
    } catch (error) {
        console.error('❌ Erro ao enviar horário pagante:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno. Tente novamente em alguns segundos.' 
        });
    }
}

/**
 * Ativar/desativar horários pagantes automáticos
 * Formato: !horapg 1 ou !horapg 0
 */
async function toggleHorariosPagantes(sock, groupJid, args) {
    try {
        if (!args || (args !== '1' && args !== '0')) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Formato incorreto!*

📝 *Uso correto:*
🍀 !horapg 1 - Ativar horários automáticos
🚫 !horapg 0 - Desativar horários automáticos

💡 *Configurar intervalo:*
🕐 !addhorapg intervalo

📋 *Status atual:* Use !horapg sem parâmetro para ver` 
            });
            return;
        }
        
        const isActive = args === '1';
        
        // Carregar dados atuais
        const horariosData = await loadHorariosData();
        if (!horariosData[groupJid]) {
            horariosData[groupJid] = {
                active: false,
                interval: '1h',
                created: new Date().toISOString()
            };
        }
        
        horariosData[groupJid].active = isActive;
        horariosData[groupJid].lastUpdate = new Date().toISOString();
        
        // Salvar configuração
        await saveHorariosData(horariosData);
        
        if (isActive) {
            // Ativar intervalo automático
            const interval = horariosData[groupJid].interval || '1h';
            const success = setupHorariosInterval(groupJid, interval, sock);
            
            if (!success) {
                await sock.sendMessage(groupJid, { 
                    text: '❌ Erro ao configurar horários automáticos.' 
                });
                return;
            }
            
            await sock.sendMessage(groupJid, { 
                text: `✅ *Horários Pagantes Ativados!* ✅

🍀 *Status:* Ativo
⏰ *Intervalo:* ${interval}
🎰 *Funcionamento:* Automático

📊 O bot enviará horários pagantes automaticamente no intervalo configurado!

💡 Para alterar intervalo: !addhorapg tempo
🚫 Para desativar: !horapg 0` 
            });
            
        } else {
            // Desativar intervalo automático
            removeHorariosInterval(groupJid);
            
            await sock.sendMessage(groupJid, { 
                text: `🚫 *Horários Pagantes Desativados!* 🚫

❌ Os horários automáticos foram interrompidos.
💡 Você ainda pode usar !horarios para enviar manualmente.

🔄 Para reativar: !horapg 1` 
            });
        }
        
        console.log(`🕐 Horários pagantes ${isActive ? 'ativados' : 'desativados'} no grupo ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar horários pagantes:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao configurar horários. Tente novamente.' 
        });
    }
}

/**
 * Definir intervalo dos horários pagantes
 * Formato: !addhorapg intervalo
 */
async function setHorariosInterval(sock, groupJid, args) {
    try {
        if (!args) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Intervalo obrigatório!*

📝 *Uso correto:*
🕐 !addhorapg intervalo

📋 *Exemplos:*
• !addhorapg 30m (30 minutos)
• !addhorapg 1h (1 hora)
• !addhorapg 2h (2 horas)

⏰ *Intervalos válidos:*
• 30m = 30 minutos
• 1h = 1 hora
• 2h = 2 horas` 
            });
            return;
        }
        
        const interval = args.trim();
        
        // Validar intervalo
        if (!parseTimeToMs(interval)) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Intervalo inválido!*

⏰ *Formatos válidos:*
• 30m (30 minutos)
• 1h (1 hora)
• 2h (2 horas)

📝 Use apenas números seguidos de 'm' (minutos) ou 'h' (horas)` 
            });
            return;
        }
        
        // Carregar dados atuais
        const horariosData = await loadHorariosData();
        if (!horariosData[groupJid]) {
            horariosData[groupJid] = {
                active: false,
                created: new Date().toISOString()
            };
        }
        
        const wasActive = horariosData[groupJid].active;
        
        // Atualizar intervalo
        horariosData[groupJid].interval = interval;
        horariosData[groupJid].lastUpdate = new Date().toISOString();
        
        // Se estava ativo, reativar automático automaticamente
        if (!wasActive) {
            horariosData[groupJid].active = true;
        }
        
        // Salvar configuração
        await saveHorariosData(horariosData);
        
        // Reconfigurar intervalo (remover antigo e criar novo)
        removeHorariosInterval(groupJid);
        
        const success = setupHorariosInterval(groupJid, interval, sock);
        if (!success) {
            await sock.sendMessage(groupJid, { 
                text: '❌ Erro ao configurar novo intervalo.' 
            });
            return;
        }
        
        await sock.sendMessage(groupJid, { 
            text: `✅ *Intervalo Configurado!* ✅

⏰ *Novo intervalo:* ${interval}
🍀 *Status:* Ativo
🎰 *Próximo horário:* Em breve

📊 Os horários pagantes serão enviados automaticamente a cada ${interval}!

🚫 Para desativar: !horapg 0
💰 Horário manual: !horarios` 
        });
        
        console.log(`🕐 Intervalo de horários pagantes configurado para ${groupJid}: ${interval}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar intervalo:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao configurar intervalo. Tente novamente.' 
        });
    }
}

/**
 * Gerar horário aleatório realista
 */
function generateRandomTime() {
    // Horários mais "estratégicos" entre 9h e 23h
    const strategicHours = [9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const hour = strategicHours[Math.floor(Math.random() * strategicHours.length)];
    
    // Minutos preferenciais (00, 15, 30, 45)
    const strategicMinutes = [0, 15, 30, 45];
    const minute = strategicMinutes[Math.floor(Math.random() * strategicMinutes.length)];
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Gerar multiplicador aleatório
 */
function generateRandomMultiplier() {
    const multipliers = [1.2, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0, 8.0, 10.0];
    return multipliers[Math.floor(Math.random() * multipliers.length)];
}

/**
 * Gerar chance aleatória
 */
function generateRandomChance() {
    return Math.floor(Math.random() * 30) + 60; // Entre 60% e 90%
}

/**
 * Obter plataforma aleatória
 */
function getRandomPlatform() {
    const platforms = [
        '🎲 Aviator',
        '🎰 Fortune Tiger',
        '💎 Mines',
        '🚀 JetX',
        '🔥 Spaceman',
        '⚡ Crash',
        '🎯 Plinko',
        '🍭 Sweet Bonanza'
    ];
    return platforms[Math.floor(Math.random() * platforms.length)];
}

module.exports = { execute };