/**
 * Sistema Anti-Link e Moderação
 * Comandos: !banextremo, !banlinkgp, !antilinkgp, !antilink, !ban
 */

const { saveConfig, getConfig } = require('../utils/config');

async function execute(command, context) {
    const { sock, groupJid, args, message } = context;
    
    switch (command.toLowerCase()) {
        case 'banextremo':
            await toggleBanExtremo(sock, groupJid, args);
            break;
        case 'banlinkgp':
            await toggleBanLinkGP(sock, groupJid, args);
            break;
        case 'antilinkgp':
            await toggleAntiLinkGP(sock, groupJid, args);
            break;
        case 'antilink':
            await toggleAntiLink(sock, groupJid, args);
            break;
        case 'ban':
            await banUser(sock, groupJid, message);
            break;
        default:
            await sock.sendMessage(groupJid, { 
                text: '❌ Comando de moderação não reconhecido.' 
            });
    }
}

/**
 * Configurar ban extremo (bane por qualquer link)
 */
async function toggleBanExtremo(sock, groupJid, args) {
    try {
        if (!args || (args !== '1' && args !== '0')) {
            const currentStatus = await getConfig(groupJid, 'banExtremo', false);
            await sock.sendMessage(groupJid, { 
                text: `🛡️ *BAN EXTREMO* 🛡️

📊 *Status atual:* ${currentStatus ? '🟢 Ativo' : '🔴 Inativo'}

📝 *Para alterar:*
💣 !banextremo 1 - Ativar
🚫 !banextremo 0 - Desativar

⚠️ *ATENÇÃO:* Modo extremo bane automaticamente qualquer usuário que enviar QUALQUER tipo de link!` 
            });
            return;
        }
        
        const isActive = args === '1';
        await saveConfig(groupJid, 'banExtremo', isActive);
        
        if (isActive) {
            // Desativar outros modos conflitantes
            await saveConfig(groupJid, 'banLinkGP', false);
            await saveConfig(groupJid, 'antiLinkGP', false);
            await saveConfig(groupJid, 'antiLink', false);
        }
        
        await sock.sendMessage(groupJid, { 
            text: `💣 *BAN EXTREMO ${isActive ? 'ATIVADO' : 'DESATIVADO'}!* 💣

${isActive ? 
    `⚠️ *MODO ULTRA RESTRITIVO ATIVO!*

🚫 *Regras ativas:*
• Qualquer link será deletado
• Usuário será banido automaticamente
• Sem exceções ou avisos

💥 *Abrange:*
• Links de sites (http/https)
• Links do WhatsApp
• Encurtadores (bit.ly, etc)
• Qualquer URL detectada` :
    `✅ *Ban extremo desativado*

💡 Outros modos disponíveis:
🛑 !banlinkgp - Ban apenas links de grupos
🧹 !antilinkgp - Apenas deletar links de grupos
🧹 !antilink - Apenas deletar qualquer link`
}

🤖 *Sistema de moderação configurado!*` 
        });
        
        console.log(`💣 Ban extremo ${isActive ? 'ativado' : 'desativado'} no grupo ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar ban extremo:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno. Tente novamente.' 
        });
    }
}

/**
 * Configurar ban por links de grupo
 */
async function toggleBanLinkGP(sock, groupJid, args) {
    try {
        if (!args || (args !== '1' && args !== '0')) {
            const currentStatus = await getConfig(groupJid, 'banLinkGP', false);
            await sock.sendMessage(groupJid, { 
                text: `🛡️ *BAN LINK GRUPO* 🛡️

📊 *Status atual:* ${currentStatus ? '🟢 Ativo' : '🔴 Inativo'}

📝 *Para alterar:*
🛑 !banlinkgp 1 - Ativar
🚫 !banlinkgp 0 - Desativar

ℹ️ *Função:* Bane usuários que enviarem links de grupos WhatsApp` 
            });
            return;
        }
        
        const isActive = args === '1';
        await saveConfig(groupJid, 'banLinkGP', isActive);
        
        if (isActive) {
            // Desativar modos conflitantes
            await saveConfig(groupJid, 'banExtremo', false);
            await saveConfig(groupJid, 'antiLinkGP', false);
        }
        
        await sock.sendMessage(groupJid, { 
            text: `🛑 *BAN LINK GRUPO ${isActive ? 'ATIVADO' : 'DESATIVADO'}!* 🛑

${isActive ? 
    `✅ *Proteção ativa contra spam de grupos!*

🚫 *Detecta e bane:*
• chat.whatsapp.com/...
• wa.me/...
• Links de convite de grupos
• Redirecionamentos para grupos

⚡ *Ação automática:*
1️⃣ Link detectado
2️⃣ Mensagem deletada
3️⃣ Usuário banido` :
    `✅ *Ban por links de grupo desativado*

💡 Outras opções:
💣 !banextremo - Ban por qualquer link
🧹 !antilinkgp - Apenas deletar (sem ban)
🧹 !antilink - Deletar qualquer link`
}

🛡️ *Moderação configurada!*` 
        });
        
        console.log(`🛑 Ban link grupo ${isActive ? 'ativado' : 'desativado'} no grupo ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar ban link grupo:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno. Tente novamente.' 
        });
    }
}

/**
 * Configurar anti-link de grupo (apenas deletar)
 */
async function toggleAntiLinkGP(sock, groupJid, args) {
    try {
        if (!args || (args !== '1' && args !== '0')) {
            const currentStatus = await getConfig(groupJid, 'antiLinkGP', false);
            await sock.sendMessage(groupJid, { 
                text: `🧹 *ANTI-LINK GRUPO* 🧹

📊 *Status atual:* ${currentStatus ? '🟢 Ativo' : '🔴 Inativo'}

📝 *Para alterar:*
🧹 !antilinkgp 1 - Ativar
🚫 !antilinkgp 0 - Desativar

ℹ️ *Função:* Deleta links de grupos sem banir o usuário` 
            });
            return;
        }
        
        const isActive = args === '1';
        await saveConfig(groupJid, 'antiLinkGP', isActive);
        
        if (isActive) {
            // Desativar modos conflitantes
            await saveConfig(groupJid, 'banExtremo', false);
            await saveConfig(groupJid, 'banLinkGP', false);
        }
        
        await sock.sendMessage(groupJid, { 
            text: `🧹 *ANTI-LINK GRUPO ${isActive ? 'ATIVADO' : 'DESATIVADO'}!* 🧹

${isActive ? 
    `✅ *Limpeza automática de links de grupos!*

🗑️ *Remove automaticamente:*
• chat.whatsapp.com/...
• wa.me/...
• Links de convite
• Redirecionamentos

😊 *Ação suave:*
• Apenas deleta a mensagem
• Não bane o usuário
• Aviso educativo opcional` :
    `✅ *Anti-link grupo desativado*

💡 Opções mais rigorosas:
🛑 !banlinkgp - Deletar E banir
💣 !banextremo - Ban por qualquer link
🧹 !antilink - Deletar qualquer link`
}

🧽 *Sistema de limpeza configurado!*` 
        });
        
        console.log(`🧹 Anti-link grupo ${isActive ? 'ativado' : 'desativado'} no grupo ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar anti-link grupo:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno. Tente novamente.' 
        });
    }
}

/**
 * Configurar anti-link geral (deletar qualquer link)
 */
async function toggleAntiLink(sock, groupJid, args) {
    try {
        if (!args || (args !== '1' && args !== '0')) {
            const currentStatus = await getConfig(groupJid, 'antiLink', false);
            await sock.sendMessage(groupJid, { 
                text: `🧹 *ANTI-LINK GERAL* 🧹

📊 *Status atual:* ${currentStatus ? '🟢 Ativo' : '🔴 Inativo'}

📝 *Para alterar:*
🧹 !antilink 1 - Ativar
🚫 !antilink 0 - Desativar

ℹ️ *Função:* Deleta qualquer tipo de link sem banir` 
            });
            return;
        }
        
        const isActive = args === '1';
        await saveConfig(groupJid, 'antiLink', isActive);
        
        if (isActive) {
            // Desativar modos conflitantes
            await saveConfig(groupJid, 'banExtremo', false);
        }
        
        await sock.sendMessage(groupJid, { 
            text: `🧹 *ANTI-LINK GERAL ${isActive ? 'ATIVADO' : 'DESATIVADO'}!* 🧹

${isActive ? 
    `✅ *Limpeza automática de todos os links!*

🗑️ *Remove automaticamente:*
• Links de sites (http/https)
• Links do WhatsApp
• Encurtadores (bit.ly, tinyurl)
• Qualquer URL detectada

💫 *Moderação suave:*
• Apenas deleta mensagens
• Não bane usuários
• Mantém grupo organizado` :
    `✅ *Anti-link geral desativado*

💡 Opções mais específicas:
🧹 !antilinkgp - Apenas links de grupos
🛑 !banlinkgp - Ban por grupos
💣 !banextremo - Ban por qualquer link`
}

🛡️ *Sistema configurado!*` 
        });
        
        console.log(`🧹 Anti-link geral ${isActive ? 'ativado' : 'desativado'} no grupo ${groupJid}`);
        
    } catch (error) {
        console.error('❌ Erro ao configurar anti-link:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno. Tente novamente.' 
        });
    }
}

/**
 * Banir usuário manualmente (responder mensagem)
 */
async function banUser(sock, groupJid, message) {
    try {
        // Verificar se é resposta a uma mensagem
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        
        if (!quotedMessage || !quotedParticipant) {
            await sock.sendMessage(groupJid, { 
                text: `❌ *Uso incorreto!*

📝 *Como usar:*
1️⃣ Responda a mensagem do usuário
2️⃣ Digite !ban

🔨 O usuário será banido imediatamente!

⚠️ *Certifique-se de responder à mensagem correta!*` 
            });
            return;
        }
        
        // Verificar se não está tentando banir um admin
        try {
            const groupMetadata = await sock.groupMetadata(groupJid);
            const targetParticipant = groupMetadata.participants.find(p => p.id === quotedParticipant);
            
            if (targetParticipant?.admin) {
                await sock.sendMessage(groupJid, { 
                    text: '⚠️ Não é possível banir administradores!' 
                });
                return;
            }
        } catch (metadataError) {
            console.error('❌ Erro ao verificar metadados do grupo:', metadataError);
        }
        
        // Executar ban
        try {
            await sock.groupParticipantsUpdate(groupJid, [quotedParticipant], 'remove');
            
            const userNumber = quotedParticipant.split('@')[0];
            await sock.sendMessage(groupJid, { 
                text: `🔨 *USUÁRIO BANIDO!* 🔨

👤 *Usuário:* +${userNumber}
⚡ *Ação:* Remoção manual
👮 *Executado por:* Administrador

🚫 O usuário foi removido do grupo.` 
            });
            
            console.log(`🔨 Usuário banido manualmente no grupo ${groupJid}: ${quotedParticipant}`);
            
        } catch (banError) {
            console.error('❌ Erro ao banir usuário:', banError);
            await sock.sendMessage(groupJid, { 
                text: '❌ Erro ao banir usuário. Verifique se o bot tem permissões de administrador.' 
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar ban manual:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro interno ao processar ban.' 
        });
    }
}

/**
 * Verificar mensagem para links e aplicar moderação
 */
async function checkMessage(sock, message, groupJid, senderId) {
    try {
        const messageText = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || '';
        
        if (!messageText) return;
        
        // Verificar configurações ativas
        const banExtremo = await getConfig(groupJid, 'banExtremo', false);
        const banLinkGP = await getConfig(groupJid, 'banLinkGP', false);
        const antiLinkGP = await getConfig(groupJid, 'antiLinkGP', false);
        const antiLink = await getConfig(groupJid, 'antiLink', false);
        
        // Detectar tipos de links
        const hasGeneralLink = /https?:\/\/|www\.|\.com|\.net|\.org|\.br|bit\.ly|tinyurl|short\.link/i.test(messageText);
        const hasWhatsAppLink = /chat\.whatsapp\.com|wa\.me\/|whatsapp\.com\/|api\.whatsapp\.com/i.test(messageText);
        
        let shouldDelete = false;
        let shouldBan = false;
        let reason = '';
        
        // Aplicar regras conforme configuração
        if (banExtremo && hasGeneralLink) {
            shouldDelete = true;
            shouldBan = true;
            reason = 'Ban extremo - qualquer link';
        } else if (banLinkGP && hasWhatsAppLink) {
            shouldDelete = true;
            shouldBan = true;
            reason = 'Ban por link de grupo WhatsApp';
        } else if (antiLinkGP && hasWhatsAppLink) {
            shouldDelete = true;
            shouldBan = false;
            reason = 'Anti-link grupo - deletar apenas';
        } else if (antiLink && hasGeneralLink) {
            shouldDelete = true;
            shouldBan = false;
            reason = 'Anti-link geral - deletar apenas';
        }
        
        if (shouldDelete) {
            // Deletar mensagem
            try {
                await sock.sendMessage(groupJid, { 
                    delete: message.key 
                });
                console.log(`🗑️ Mensagem deletada: ${reason}`);
            } catch (deleteError) {
                console.error('❌ Erro ao deletar mensagem:', deleteError);
            }
            
            if (shouldBan) {
                // Banir usuário
                try {
                    await sock.groupParticipantsUpdate(groupJid, [senderId], 'remove');
                    
                    const userNumber = senderId.split('@')[0];
                    await sock.sendMessage(groupJid, { 
                        text: `🔨 *USUÁRIO BANIDO AUTOMATICAMENTE!* 🔨

👤 *Usuário:* +${userNumber}
⚡ *Motivo:* ${reason}
🛡️ *Sistema:* Moderação automática

🚫 Link detectado e usuário removido.` 
                    });
                    
                    console.log(`🔨 Usuário banido automaticamente: ${senderId} - ${reason}`);
                    
                } catch (banError) {
                    console.error('❌ Erro ao banir usuário automaticamente:', banError);
                }
            } else {
                // Apenas avisar sobre deleção
                const userNumber = senderId.split('@')[0];
                await sock.sendMessage(groupJid, { 
                    text: `🧹 *LINK REMOVIDO* 🧹

👤 *Usuário:* +${userNumber}
🗑️ *Motivo:* ${reason}

💡 Evite enviar links no grupo.` 
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar mensagem:', error);
    }
}

module.exports = { 
    execute,
    checkMessage 
};