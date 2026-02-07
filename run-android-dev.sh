#!/bin/bash

# Script completo para rodar o app React Native no Android
# Resolve o erro "Unable to load script" garantindo que tudo está configurado

echo "🚀 Preparando ambiente para rodar React Native no Android..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se adb está disponível
if ! command -v adb &> /dev/null; then
    echo "⚠️  ADB não encontrado. Certifique-se de que o Android SDK está instalado."
    echo "   Você pode precisar adicionar ao PATH:"
    echo "   export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
else
    echo "✅ ADB encontrado"
fi

# Verificar se há dispositivos conectados
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device$" | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "⚠️  Nenhum dispositivo Android detectado!"
    echo "   Conecte um dispositivo via USB ou inicie um emulador."
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
else
    echo "✅ $DEVICE_COUNT dispositivo(s) Android detectado(s)"
    
    # Configurar port forwarding para Metro (necessário para dispositivo físico via USB)
    echo "🔌 Configurando port forwarding (adb reverse)..."
    adb reverse tcp:8081 tcp:8081 || echo "⚠️  Falha ao configurar port forwarding (pode não ser necessário para emulador)"
fi

# Verificar se Metro está rodando
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Metro bundler já está rodando na porta 8081"
    echo ""
    echo "🎯 Próximo passo: Execute o app no Android Studio ou via:"
    echo "   npm run android"
    exit 0
fi

echo ""
echo "📦 Iniciando Metro Bundler..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANTE: Deixe este terminal aberto!"
echo "   O Metro bundler DEVE estar rodando para o app funcionar."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Em outro terminal, execute:"
echo "   npm run android"
echo "   ou rode pelo Android Studio"
echo ""
echo "🔄 Iniciando Metro..."
echo ""

# Iniciar Metro bundler
npm start

