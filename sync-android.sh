#!/bin/bash

# Script para sincronizar React Native com Android Studio
# Equivalente ao "cap sync" do Capacitor, mas para React Native

echo "🔄 Sincronizando React Native com Android Studio..."
echo ""

# 1. Instalar/atualizar dependências Node (se necessário)
echo "📦 Verificando dependências Node..."
npm install --legacy-peer-deps || echo "⚠️  Algumas dependências podem ter conflitos, mas continuando..."

# 2. Limpar cache do Metro (opcional, mas recomendado)
echo "🧹 Limpando cache do Metro..."
rm -rf node_modules/.cache
rm -rf /tmp/metro-*

# 3. Limpar e sincronizar build Android
echo "🔨 Limpando build Android anterior..."
cd android
./gradlew clean

echo "📱 Sincronizando dependências nativas do Gradle..."
./gradlew tasks --all > /dev/null 2>&1  # Força sync do Gradle
cd ..

echo ""
echo "✅ Sincronização concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Abra o Android Studio"
echo "2. File > Open > Selecione a pasta 'android' deste projeto"
echo "3. Aguarde a sincronização automática do Gradle no Android Studio"
echo "4. (Opcional) Se não sincronizar automaticamente, clique no ícone de 'Sync Project with Gradle Files' (🔄)"
echo "5. Em outro terminal, execute: npm start"
echo "6. No Android Studio, clique em Run (▶️)"
echo ""
echo "💡 Dica: O React Native usa autolinking, então as dependências nativas"
echo "   são sincronizadas automaticamente quando você abre o projeto no Android Studio."
echo ""

