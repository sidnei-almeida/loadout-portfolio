#!/bin/bash

# Script de preparação para Android Studio
# Execute este script antes de abrir o projeto no Android Studio

echo "🚀 Preparando projeto para Android Studio..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Instalar dependências Node
echo "📦 Instalando dependências Node..."
npm install --legacy-peer-deps

# Limpar cache do Metro
echo "🧹 Limpando cache do Metro..."
rm -rf node_modules/.cache
rm -rf /tmp/metro-*

# Limpar build Android anterior
echo "🧹 Limpando build Android anterior..."
cd android
./gradlew clean
cd ..

echo ""
echo "✅ Preparação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Abra o Android Studio"
echo "2. File > Open > Selecione a pasta 'android' deste projeto"
echo "3. Aguarde a sincronização do Gradle"
echo "4. Em outro terminal, execute: npm start"
echo "5. No Android Studio, clique em Run (▶️)"
echo ""

