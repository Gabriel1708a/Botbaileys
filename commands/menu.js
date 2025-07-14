/**
 * Comando !menu - Lista de comandos disponíveis
 */

async function execute(context) {
    const { sock, groupJid } = context;
    
    const menuText = `📋 *LISTA DE COMANDOS DO BOT* 📋

🤖 *Comandos Gerais:*
📋 !menu – Lista de comandos

👥 *Marcação e Anúncios:*
📣 !all – Menciona todos silenciosamente
🗞️ !addads mensagem|intervalo – Cria anúncio automático
📌 !listads – Lista anúncios ativos
🗑️ !rmads ID – Remove anúncio

👋 *Boas-vindas:*
🎉 !bv 1/0 – Ativa/desativa boas-vindas
🙌 !legendabv mensagem – Personaliza mensagem

🔐 *Controle do Grupo:*
🔓 !abrirgrupo – Abre grupo
🔐 !fechargrupo – Fecha grupo
⏰ !abrirgp HH:MM – Agenda abertura
⏰ !fechargp HH:MM – Agenda fechamento
🚫 !afgp 0 – Cancela agendamento

🎁 *Sorteios:*
🎉 !sorteio prêmio|tempo – Cria sorteio com reações

🎰 *Horários Pagantes:*
💰 !horarios – Envia horário sugestivo
🍀 !horapg 1/0 – Ativa/desativa automático
🕐 !addhorapg intervalo – Define intervalo

🛡️ *Moderação Anti-Link:*
💣 !banextremo – Ban automático por link
🛑 !banlinkgp – Ban por link de grupo
🧹 !antilinkgp – Deleta link de grupo
🧹 !antilink – Deleta qualquer link
🔨 !ban – Ban manual (responder mensagem)

⚠️ *Observação:* Comandos marcados requerem permissão de administrador!

🤖 *Bot Administrador WhatsApp* 🤖`;

    try {
        await sock.sendMessage(groupJid, { text: menuText });
    } catch (error) {
        console.error('❌ Erro ao enviar menu:', error);
        await sock.sendMessage(groupJid, { 
            text: '❌ Erro ao exibir menu. Tente novamente.' 
        });
    }
}

module.exports = { execute };