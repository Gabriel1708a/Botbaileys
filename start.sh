#!/bin/bash

echo "🤖 Iniciando Bot Administrador WhatsApp..."
echo "📱 Certifique-se de ter configurado seu número no index.js"
echo "⚡ Preparando para gerar código de pareamento..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado! Instale Node.js 16+ primeiro."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "🚀 Iniciando bot..."
echo "📋 Use Ctrl+C para parar o bot"
echo ""

node index.js