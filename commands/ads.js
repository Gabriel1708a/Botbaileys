/**
 * Sistema de Anúncios Automáticos
 * Comandos: !addads, !listads, !rmads
 */

const { saveAdsData, loadAdsData } = require('../utils/config');
const { setupAdInterval, removeAdInterval, parseTimeToMs } = require('../utils/scheduler');

async function execute(command, context) {
    const { sock, groupJid, args } = context;
    
    switch (command.toLowerCase()) {
        case 'addads':
            await addAd(sock, groupJid, args);
            break;
        case 'listads':
            await listAds(sock, groupJid);
            break;
        case 'rmads':
            await removeAd(sock, groupJid, args);
            break;
        default:
            await sock.sendMessage(groupJid, { 
                text: '❌ Comando de anúncio não reconhecido.' 
            });
    }
}

/**
 * Adicionar novo anúncio automático
 * Formato: !addads mensagem|intervalo
 */
async function addAd(sock, groupJid, args) {
    try {
        if (!args || !args.includes('|')) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Formato incorreto!*

📝 *Uso correto:*
🗞️ !addads mensagem|intervalo

📋 *Exemplos:*
• !addads Bem-vindos ao grupo!|30m
• !addads Lembrete importante|1h
• !addads Promoção especial|2h

⏰ *Intervalos válidos:*
• 30m = 30 minutos
• 1h = 1 hora
• 2h = 2 horas` 
            });
            return;
        }
        
        const [message, interval] = args.split('|').map(s => s.trim());
        
        if (!message || !interval) {
            await sock.sendMessage(groupJid, { 
                text: '❌ Mensagem e intervalo são obrigatórios!' 
            });
            return;
        }
        
        // Validar intervalo
        if (!parseTimeToMs(interval)) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Intervalo inválido!*

⏰ *Formatos válidos:*
• 30m (30 minutos)
• 1h (1 hora)
• 2h (2 horas)` 
            });
            return;
        }
        
        // Carregar anúncios existentes
        const adsData = await loadAdsData();
        if (!adsData[groupJid]) {
            adsData[groupJid] = {};
        }
        
        // Gerar ID único para o anúncio
        const adId = generateAdId(adsData[groupJid]);
        
        // Criar anúncio
        const adInfo = {
            message,
            interval,
            active: true,
            created: new Date().toISOString(),
            lastSent: null
        };
        
        adsData[groupJid][adId] = adInfo;
        
        // Salvar dados
        const saved = await saveAdsData(adsData);
        if (!saved) {
            await sock.sendMessage(groupJid, { 
                text: '❌ Erro ao salvar anúncio. Tente novamente.' 
            });
            return;
        }
        
        // Configurar intervalo automático
        const intervalSetup = setupAdInterval(groupJid, adId, adInfo, sock);
        if (!intervalSetup) {
            await sock.sendMessage(groupJid, { 
                text: '❌ Erro ao configurar intervalo do anúncio.' 
            });
            return;
        }
        
        await sock.sendMessage(groupJid, { 
            text: `✅ *Anúncio criado com sucesso!*

📋 *Detalhes:*
🆔 ID: ${adId}
💬 Mensagem: ${message}
⏰ Intervalo: ${interval}
🟢 Status: Ativo

📢 O anúncio será enviado automaticamente a cada ${interval}!` 
        });
        
        console.log(`📢 Anúncio criado: ${groupJid} - ${adId} (${interval})`);
        
    } catch (error) {
        console.error('❌ Erro ao adicionar anúncio:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao criar anúncio. Tente novamente.' 
        });
    }
}

/**
 * Listar anúncios ativos
 */
async function listAds(sock, groupJid) {
    try {
        const adsData = await loadAdsData();
        const groupAds = adsData[groupJid] || {};
        
        if (Object.keys(groupAds).length === 0) {
            await sock.sendMessage(groupJid, { 
                text: `📋 *LISTA DE ANÚNCIOS*

🔍 Nenhum anúncio cadastrado neste grupo.

💡 Para criar um anúncio:
🗞️ !addads mensagem|intervalo` 
            });
            return;
        }
        
        let listText = '📋 *LISTA DE ANÚNCIOS ATIVOS* 📋\n\n';
        
        Object.entries(groupAds).forEach(([adId, adInfo]) => {
            const status = adInfo.active ? '🟢 Ativo' : '🔴 Inativo';
            const created = new Date(adInfo.created).toLocaleString('pt-BR');
            
            listText += `🆔 *ID:* ${adId}\n`;
            listText += `💬 *Mensagem:* ${adInfo.message}\n`;
            listText += `⏰ *Intervalo:* ${adInfo.interval}\n`;
            listText += `📊 *Status:* ${status}\n`;
            listText += `📅 *Criado:* ${created}\n`;
            listText += `━━━━━━━━━━━━━━━━━━━━\n`;
        });
        
        listText += '\n🗑️ Para remover: !rmads ID';
        
        await sock.sendMessage(groupJid, { text: listText });
        
    } catch (error) {
        console.error('❌ Erro ao listar anúncios:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro ao carregar lista de anúncios.' 
        });
    }
}

/**
 * Remover anúncio
 * Formato: !rmads ID
 */
async function removeAd(sock, groupJid, args) {
    try {
        if (!args) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *ID do anúncio obrigatório!*

📝 *Uso correto:*
🗑️ !rmads ID

💡 Para ver os IDs:
📌 !listads` 
            });
            return;
        }
        
        const adId = args.trim();
        
        // Carregar anúncios
        const adsData = await loadAdsData();
        const groupAds = adsData[groupJid] || {};
        
        if (!groupAds[adId]) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Anúncio não encontrado!*

🆔 ID: ${adId}

📌 Use !listads para ver os anúncios disponíveis.` 
            });
            return;
        }
        
        // Remover intervalo ativo
        removeAdInterval(groupJid, adId);
        
        // Remover dos dados
        const adInfo = groupAds[adId];
        delete groupAds[adId];
        
        // Salvar dados atualizados
        await saveAdsData(adsData);
        
        await sock.sendMessage(groupJid, { 
            text: `✅ *Anúncio removido com sucesso!*

🆔 ID: ${adId}
💬 Mensagem: ${adInfo.message}
⏰ Intervalo: ${adInfo.interval}

🛑 O anúncio automático foi interrompido.` 
        });
        
        console.log(`🗑️ Anúncio removido: ${groupJid} - ${adId}`);
        
    } catch (error) {
        console.error('❌ Erro ao remover anúncio:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao remover anúncio. Tente novamente.' 
        });
    }
}

/**
 * Gerar ID único para anúncio
 */
function generateAdId(existingAds) {
    const existingIds = Object.keys(existingAds).map(id => parseInt(id) || 0);
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return (maxId + 1).toString();
}

module.exports = { execute };