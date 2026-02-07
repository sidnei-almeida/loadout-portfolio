#!/bin/bash

echo "🧹 Limpando cache e rebuild completo do Android..."
echo ""

# Parar o Metro bundler se estiver rodando
echo "📦 Parando processos do Metro..."
pkill -f "react-native" || true
pkill -f "metro" || true

# Limpar cache do Metro
echo "🗑️  Limpando cache do Metro bundler..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true

# Limpar node_modules e reinstalar (opcional, descomente se necessário)
# echo "📦 Limpando node_modules..."
# rm -rf node_modules
# npm install

# Limpar cache do watchman
echo "👁️  Limpando cache do Watchman..."
watchman watch-del-all 2>/dev/null || echo "Watchman não está instalado, pulando..."

# Limpar Android
echo "🤖 Limpando build do Android..."
cd android

# Limpar gradle
echo "  → Limpando Gradle..."
./gradlew clean --no-daemon || ./gradlew clean

# Limpar build folders
echo "  → Removendo pastas de build..."
rm -rf app/build
rm -rf build
rm -rf .gradle

cd ..

# Limpar cache do React Native
echo "⚛️  Limpando cache do React Native..."
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

echo ""
echo "✅ Limpeza completa!"
echo ""
echo "📱 Próximos passos:"
echo "   1. Execute: npx react-native start --reset-cache"
echo "   2. Em outro terminal: npx react-native run-android"
echo ""
echo "💡 Dica: Se ainda não funcionar, desinstale o app do dispositivo/emulador e reinstale."

