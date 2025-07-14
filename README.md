# 🤖 Bot Administrador de Grupos WhatsApp

Bot completo para administração de grupos WhatsApp usando Baileys (Node.js) com funcionalidades avançadas de moderação, anúncios automáticos, sorteios, horários pagantes e muito mais!

## 🚀 Funcionalidades

### 🧾 Comandos Gerais
- `!menu` - Lista todos os comandos disponíveis

### 👥 Marcação e Anúncios  
- `!all` - Menciona todos os membros silenciosamente
- `!addads mensagem|intervalo` - Cria anúncio automático
- `!listads` - Lista anúncios ativos
- `!rmads ID` - Remove anúncio

### 👋 Sistema de Boas-vindas
- `!bv 1/0` - Ativa/desativa boas-vindas
- `!legendabv mensagem` - Personaliza mensagem (usar @user e @group)

### 🔐 Controle do Grupo
- `!abrirgrupo` - Abre grupo manualmente
- `!fechargrupo` - Fecha grupo manualmente
- `!abrirgp HH:MM` - Agenda abertura automática
- `!fechargp HH:MM` - Agenda fechamento automático
- `!afgp 0` - Cancela agendamentos

### 🎁 Sistema de Sorteios
- `!sorteio prêmio|tempo` - Cria sorteio com reações ✅

### 🎰 Horários Pagantes
- `!horarios` - Envia horário sugestivo manual
- `!horapg 1/0` - Ativa/desativa envio automático
- `!addhorapg intervalo` - Define intervalo automático

### 🛡️ Sistema Anti-Link
- `!banextremo 1/0` - Ban automático por qualquer link
- `!banlinkgp 1/0` - Ban por link de grupo WhatsApp
- `!antilinkgp 1/0` - Delete link de grupo (sem ban)
- `!antilink 1/0` - Delete qualquer link (sem ban)
- `!ban` - Ban manual (responder mensagem)

## 📦 Instalação

### Pré-requisitos
- Node.js 16 ou superior
- NPM ou Yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd whatsapp-admin-bot
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o bot
Edite o arquivo `index.js` na linha 98 e substitua pelo seu número:
```javascript
const pairingCode = await this.sock.requestPairingCode('5511999999999'); // Seu número aqui
```

### 4. Execute o bot
```bash
npm start
```

### 5. Faça o pareamento
1. Execute o bot
2. Copie o código de 8 dígitos que aparece no terminal
3. No WhatsApp, vá em **Dispositivos Conectados > Conectar Dispositivo**
4. Digite o código de pareamento

## 🔧 Configuração

### Estrutura de Arquivos
```
whatsapp-admin-bot/
├── commands/           # Comandos modularizados
│   ├── menu.js        # Lista de comandos
│   ├── all.js         # Marcação silenciosa
│   ├── ads.js         # Sistema de anúncios
│   ├── welcome.js     # Boas-vindas
│   ├── group.js       # Controle de grupo
│   ├── sorteio.js     # Sistema de sorteios
│   ├── horarios.js    # Horários pagantes
│   └── antilink.js    # Moderação anti-link
├── utils/             # Utilitários
│   ├── config.js      # Sistema de configuração
│   └── scheduler.js   # Agendador de tarefas
├── data/              # Dados persistentes (JSON)
├── session/           # Sessão do WhatsApp
└── index.js           # Arquivo principal
```

### Permissões Necessárias
O bot precisa ser **administrador** nos grupos para:
- Abrir/fechar grupos
- Banir usuários
- Deletar mensagens
- Obter lista de membros

## 🌐 Integração Futura com Laravel

O bot está preparado para fácil integração com painel Laravel:

### Arquitetura Preparada
- ✅ Código modularizado por comandos
- ✅ Sistema de configuração com `saveConfig()` e `loadConfig()`
- ✅ Identificação única por `groupId`
- ✅ Persistência em JSON (adaptável para API)

### Endpoints Futuros
```javascript
// Consultar status do grupo
GET /api/groups/{groupId}/status

// Salvar configurações
POST /api/groups/{groupId}/config

// Enviar mensagem via painel
POST /api/groups/{groupId}/message

// Gerenciar anúncios
POST /api/groups/{groupId}/ads
```

## ⚡ Recursos Técnicos

### Conexão Robusta
- ✅ Pareamento via código (sem QR Code)
- ✅ Reconexão automática
- ✅ Múltiplas sessões
- ✅ Sessão persistente

### Performance
- ✅ Tarefas agendadas otimizadas
- ✅ Verificação de status de grupo
- ✅ Sistema de cache de configurações
- ✅ Logs detalhados

### Segurança
- ✅ Validação de permissões
- ✅ Proteção contra spam
- ✅ Sistema anti-link configurável
- ✅ Moderação automática

## 📱 Exemplos de Uso

### Anúncios Automáticos
```
!addads Bem-vindos ao grupo!|30m
!addads Horário de funcionamento: 9h às 18h|1h
!listads
!rmads 1
```

### Agendamento de Grupo
```
!abrirgp 09:00
!fechargp 22:00
!afgp 0  # cancela agendamentos
```

### Sorteios
```
!sorteio iPhone 15|5m
!sorteio R$ 100|1h
```

### Sistema Anti-Link
```
!banextremo 1      # Ban por qualquer link
!banlinkgp 1       # Ban apenas grupos
!antilinkgp 1      # Delete grupos (sem ban)
!antilink 1        # Delete qualquer (sem ban)
```

## 🛠️ Desenvolvimento

### Adicionar Novo Comando
1. Crie arquivo em `commands/novocomando.js`
2. Implemente função `execute(context)`
3. Adicione ao `index.js` no switch case
4. Teste e documente

### Personalizar Respostas
Todas as mensagens usam emojis e estilo visual. Mantenha o padrão:
```javascript
const message = `✅ *TÍTULO* ✅

💬 Detalhes aqui
📊 Mais informações

💡 Dica útil`;
```

## 🚫 Limitações

- Requer Node.js 16+
- Precisa de permissões de admin
- Grupos muito grandes podem ter latência
- WhatsApp Business API tem limitações

## 📞 Suporte

Para dúvidas e suporte:
- 📧 Email: suporte@exemplo.com
- 💬 WhatsApp: +55 11 99999-9999
- 🐛 Issues: GitHub Issues

## 📄 Licença

MIT License - veja LICENSE para detalhes.

---

**🤖 Bot Administrador WhatsApp - Solução completa para gestão de grupos!**