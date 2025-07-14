# 🧪 INSTRUÇÕES DE TESTE - BOT WHATSAPP

## 📱 Bot Configurado
**Número:** `5543991258813`

## 🚀 Como Testar

### 1. **Iniciar o Bot**
```bash
npm start
# ou
./start.sh
```

### 2. **Pareamento**
1. Execute o bot
2. Aparecerá o código de 8 dígitos no terminal
3. No WhatsApp Web/App: Configurações > Dispositivos Conectados > Conectar Dispositivo
4. Digite o código de pareamento

### 3. **Testar Comandos Básicos**

**📋 Menu:**
```
!menu
```

**📣 Marcação (só admin):**
```
!all
!all Olá pessoal!
```

**📢 Anúncios:**
```
!addads Bem-vindos ao grupo!|30m
!listads
!rmads 1
```

**👋 Boas-vindas:**
```
!bv 1
!legendabv Olá @user! Bem-vindo ao @group 🎉
```

**🔐 Controle de Grupo (só admin):**
```
!abrirgrupo
!fechargrupo
!abrirgp 09:00
!fechargp 22:00
!afgp 0
```

**🎁 Sorteio:**
```
!sorteio iPhone 15|2m
```
*Depois reaja com ✅*

**🎰 Horários:**
```
!horarios
!horapg 1
!addhorapg 1h
```

**🛡️ Anti-link (só admin):**
```
!banextremo 1
!banlinkgp 1
!antilinkgp 1
!antilink 1
```

## ⚠️ Importante

### **Permissões Necessárias:**
- Bot deve ser **ADMINISTRADOR** no grupo
- Para banir, deletar mensagens, controlar grupo

### **Arquivos Criados Durante Uso:**
- `session/` - Credenciais do WhatsApp
- `data/` - Configurações dos grupos

### **Logs:**
- Terminal mostra todas as ações em tempo real
- Códigos de emoji para fácil identificação

## 🔧 Comandos de Admin

**Apenas administradores podem usar:**
- !all, !addads, !rmads, !bv, !legendabv
- !abrirgrupo, !fechargrupo, !abrirgp, !fechargp
- !sorteio, !banextremo, !ban, etc.

**Todos podem usar:**
- !menu, !horarios

## ✅ Validação de Funcionamento

1. **✅ Bot conecta e mantém sessão**
2. **✅ Responde ao !menu**
3. **✅ !all funciona (se admin)**
4. **✅ Anúncios automáticos funcionam**
5. **✅ Boas-vindas automáticas (add alguém)**
6. **✅ Sorteios com reações**
7. **✅ Anti-link detecta e age**
8. **✅ Agendamentos funcionam**

## 🐛 Resolução de Problemas

**Bot não conecta:**
- Verificar número configurado
- Tentar novo pareamento
- Limpar pasta `session/`

**Comandos não funcionam:**
- Verificar se bot é admin
- Verificar se está em grupo
- Ver logs no terminal

**Anúncios não enviam:**
- Verificar sintaxe: `mensagem|tempo`
- Usar formatos: 30m, 1h, 2h

## 📊 Status dos Arquivos

```
Bot Configurado: ✅
Número: 5543991258813 ✅
Upload Git: ✅
Documentação: ✅
Testes: Pendente ⏳
```

**🎯 PRONTO PARA TESTES!**