const moment = require('moment-timezone');
const { 
    loadAdsData, 
    loadSchedulesData, 
    loadHorariosData, 
    isGroupActive,
    getAllGroups 
} = require('./config');

// Mapas para controlar intervalos ativos
const activeAdsIntervals = new Map();
const activeHorariosIntervals = new Map();

/**
 * Configurar todas as tarefas agendadas
 * @param {object} sock - Instância do socket Baileys
 */
async function setupScheduledTasks(sock) {
    console.log('⏰ Configurando tarefas agendadas...');
    
    // Configurar anúncios automáticos
    await setupAdsScheduler(sock);
    
    // Configurar agendamentos de grupo (abertura/fechamento)
    await setupGroupScheduler(sock);
    
    // Configurar horários pagantes
    await setupHorariosScheduler(sock);
    
    // Verificar agendamentos a cada minuto
    setInterval(async () => {
        await checkScheduledTasks(sock);
    }, 60000); // 1 minuto
    
    console.log('✅ Tarefas agendadas configuradas!');
}

/**
 * Configurar anúncios automáticos
 * @param {object} sock - Socket do WhatsApp
 */
async function setupAdsScheduler(sock) {
    try {
        const adsData = await loadAdsData();
        
        for (const [groupId, ads] of Object.entries(adsData)) {
            if (!await isGroupActive(groupId)) continue;
            
            for (const [adId, adInfo] of Object.entries(ads)) {
                if (!adInfo.active) continue;
                
                const intervalMs = parseTimeToMs(adInfo.interval);
                if (!intervalMs) continue;
                
                const intervalKey = `${groupId}_${adId}`;
                
                // Limpar intervalo existente se houver
                if (activeAdsIntervals.has(intervalKey)) {
                    clearInterval(activeAdsIntervals.get(intervalKey));
                }
                
                // Criar novo intervalo
                const intervalId = setInterval(async () => {
                    try {
                        // Verificar se grupo ainda está ativo
                        if (!(await isGroupActive(groupId))) {
                            clearInterval(intervalId);
                            activeAdsIntervals.delete(intervalKey);
                            return;
                        }
                        
                        await sock.sendMessage(groupId, { 
                            text: `📢 ${adInfo.message}\n\n_Anúncio automático ${adId}_` 
                        });
                        
                        console.log(`📢 Anúncio enviado: ${groupId} - ${adId}`);
                        
                    } catch (error) {
                        console.error('❌ Erro ao enviar anúncio:', error);
                    }
                }, intervalMs);
                
                activeAdsIntervals.set(intervalKey, intervalId);
                console.log(`📢 Anúncio ${adId} ativado para ${groupId} (${adInfo.interval})`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao configurar anúncios:', error);
    }
}

/**
 * Configurar agendamentos de grupos
 * @param {object} sock - Socket do WhatsApp
 */
async function setupGroupScheduler(sock) {
    // Os agendamentos de grupo são verificados a cada minuto na função checkScheduledTasks
    console.log('📅 Agendamentos de grupo carregados');
}

/**
 * Configurar horários pagantes
 * @param {object} sock - Socket do WhatsApp
 */
async function setupHorariosScheduler(sock) {
    try {
        const horariosData = await loadHorariosData();
        
        for (const [groupId, config] of Object.entries(horariosData)) {
            if (!config.active || !await isGroupActive(groupId)) continue;
            
            const intervalMs = parseTimeToMs(config.interval || '1h');
            const intervalKey = groupId;
            
            // Limpar intervalo existente se houver
            if (activeHorariosIntervals.has(intervalKey)) {
                clearInterval(activeHorariosIntervals.get(intervalKey));
            }
            
            // Criar novo intervalo
            const intervalId = setInterval(async () => {
                try {
                    // Verificar se grupo ainda está ativo
                    if (!(await isGroupActive(groupId))) {
                        clearInterval(intervalId);
                        activeHorariosIntervals.delete(intervalKey);
                        return;
                    }
                    
                    const horarioSugestao = generateRandomTime();
                    const message = `🍀 *HORÁRIO PAGANTE* 🍀\n\n💰 Melhor horário para apostar:\n⏰ *${horarioSugestao}*\n\n🎰 Boa sorte! 🍀`;
                    
                    await sock.sendMessage(groupId, { text: message });
                    console.log(`🕐 Horário pagante enviado: ${groupId} - ${horarioSugestao}`);
                    
                } catch (error) {
                    console.error('❌ Erro ao enviar horário pagante:', error);
                }
            }, intervalMs);
            
            activeHorariosIntervals.set(intervalKey, intervalId);
            console.log(`🕐 Horários pagantes ativados para ${groupId} (${config.interval || '1h'})`);
        }
    } catch (error) {
        console.error('❌ Erro ao configurar horários pagantes:', error);
    }
}

/**
 * Verificar tarefas agendadas (agendamentos de grupo)
 * @param {object} sock - Socket do WhatsApp
 */
async function checkScheduledTasks(sock) {
    try {
        const schedulesData = await loadSchedulesData();
        const now = moment().tz('America/Sao_Paulo');
        const currentTime = now.format('HH:mm');
        
        for (const [groupId, schedules] of Object.entries(schedulesData)) {
            if (!await isGroupActive(groupId)) continue;
            
            // Verificar agendamento de abertura
            if (schedules.openTime && schedules.openTime === currentTime) {
                try {
                    await sock.groupSettingUpdate(groupId, 'not_announcement');
                    await sock.sendMessage(groupId, { 
                        text: '🔓 *Grupo Aberto!*\n\n📱 Todos podem enviar mensagens agora!' 
                    });
                    console.log(`🔓 Grupo aberto automaticamente: ${groupId}`);
                } catch (error) {
                    console.error('❌ Erro ao abrir grupo:', error);
                }
            }
            
            // Verificar agendamento de fechamento
            if (schedules.closeTime && schedules.closeTime === currentTime) {
                try {
                    await sock.groupSettingUpdate(groupId, 'announcement');
                    await sock.sendMessage(groupId, { 
                        text: '🔐 *Grupo Fechado!*\n\n👥 Apenas administradores podem enviar mensagens.' 
                    });
                    console.log(`🔐 Grupo fechado automaticamente: ${groupId}`);
                } catch (error) {
                    console.error('❌ Erro ao fechar grupo:', error);
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro ao verificar agendamentos:', error);
    }
}

/**
 * Adicionar ou atualizar anúncio automático
 * @param {string} groupId - ID do grupo
 * @param {string} adId - ID do anúncio
 * @param {object} adInfo - Informações do anúncio
 * @param {object} sock - Socket do WhatsApp
 */
function setupAdInterval(groupId, adId, adInfo, sock) {
    const intervalMs = parseTimeToMs(adInfo.interval);
    if (!intervalMs) return false;
    
    const intervalKey = `${groupId}_${adId}`;
    
    // Limpar intervalo existente se houver
    if (activeAdsIntervals.has(intervalKey)) {
        clearInterval(activeAdsIntervals.get(intervalKey));
    }
    
    // Criar novo intervalo
    const intervalId = setInterval(async () => {
        try {
            if (!(await isGroupActive(groupId))) {
                clearInterval(intervalId);
                activeAdsIntervals.delete(intervalKey);
                return;
            }
            
            await sock.sendMessage(groupId, { 
                text: `📢 ${adInfo.message}\n\n_Anúncio automático ${adId}_` 
            });
            
        } catch (error) {
            console.error('❌ Erro ao enviar anúncio:', error);
        }
    }, intervalMs);
    
    activeAdsIntervals.set(intervalKey, intervalId);
    return true;
}

/**
 * Remover anúncio automático
 * @param {string} groupId - ID do grupo
 * @param {string} adId - ID do anúncio
 */
function removeAdInterval(groupId, adId) {
    const intervalKey = `${groupId}_${adId}`;
    
    if (activeAdsIntervals.has(intervalKey)) {
        clearInterval(activeAdsIntervals.get(intervalKey));
        activeAdsIntervals.delete(intervalKey);
        return true;
    }
    
    return false;
}

/**
 * Configurar horários pagantes para um grupo
 * @param {string} groupId - ID do grupo
 * @param {string} interval - Intervalo (ex: '1h', '30m')
 * @param {object} sock - Socket do WhatsApp
 */
function setupHorariosInterval(groupId, interval, sock) {
    const intervalMs = parseTimeToMs(interval);
    if (!intervalMs) return false;
    
    const intervalKey = groupId;
    
    // Limpar intervalo existente se houver
    if (activeHorariosIntervals.has(intervalKey)) {
        clearInterval(activeHorariosIntervals.get(intervalKey));
    }
    
    // Criar novo intervalo
    const intervalId = setInterval(async () => {
        try {
            if (!(await isGroupActive(groupId))) {
                clearInterval(intervalId);
                activeHorariosIntervals.delete(intervalKey);
                return;
            }
            
            const horarioSugestao = generateRandomTime();
            const message = `🍀 *HORÁRIO PAGANTE* 🍀\n\n💰 Melhor horário para apostar:\n⏰ *${horarioSugestao}*\n\n🎰 Boa sorte! 🍀`;
            
            await sock.sendMessage(groupId, { text: message });
            
        } catch (error) {
            console.error('❌ Erro ao enviar horário pagante:', error);
        }
    }, intervalMs);
    
    activeHorariosIntervals.set(intervalKey, intervalId);
    return true;
}

/**
 * Remover horários pagantes de um grupo
 * @param {string} groupId - ID do grupo
 */
function removeHorariosInterval(groupId) {
    const intervalKey = groupId;
    
    if (activeHorariosIntervals.has(intervalKey)) {
        clearInterval(activeHorariosIntervals.get(intervalKey));
        activeHorariosIntervals.delete(intervalKey);
        return true;
    }
    
    return false;
}

/**
 * Converter string de tempo para milissegundos
 * @param {string} timeStr - String como '30m', '1h', '2h'
 * @returns {number|null} Tempo em milissegundos
 */
function parseTimeToMs(timeStr) {
    if (!timeStr) return null;
    
    const match = timeStr.match(/^(\d+)([mh])$/);
    if (!match) return null;
    
    const [, value, unit] = match;
    const num = parseInt(value);
    
    switch (unit) {
        case 'm': return num * 60 * 1000; // minutos
        case 'h': return num * 60 * 60 * 1000; // horas
        default: return null;
    }
}

/**
 * Gerar horário aleatório para horários pagantes
 * @returns {string} Horário no formato HH:MM
 */
function generateRandomTime() {
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

module.exports = {
    setupScheduledTasks,
    setupAdInterval,
    removeAdInterval,
    setupHorariosInterval,
    removeHorariosInterval,
    parseTimeToMs
};