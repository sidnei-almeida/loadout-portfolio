#!/bin/bash
# Script para conectar o app ao Metro Bundler

echo "🔌 Configurando conexão com Metro..."
echo ""

# Verificar se há dispositivos conectados
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device$" | wc -l)
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "⚠️  Nenhum dispositivo Android detectado!"
    echo "   Conecte um dispositivo via USB ou inicie um emulador."
    exit 1
fi

echo "✅ $DEVICE_COUNT dispositivo(s) detectado(s)"

# Configurar port forwarding
echo "🔌 Configurando port forwarding..."
adb reverse tcp:8081 tcp:8081

if [ $? -eq 0 ]; then
    echo "✅ Port forwarding configurado (8081 → 8081)"
else
    echo "⚠️  Erro ao configurar port forwarding"
    exit 1
fi

# Verificar se Metro está rodando
echo ""
echo "🔍 Verificando se Metro está rodando..."
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Metro está rodando na porta 8081"
    
    # Testar conexão
    if curl -s http://localhost:8081/status >/dev/null 2>&1 ; then
        echo "✅ Metro está respondendo"
    else
        echo "⚠️  Metro está escutando mas não está respondendo"
    fi
else
    echo "❌ Metro NÃO está rodando na porta 8081"
    echo ""
    echo "💡 Inicie o Metro em outro terminal:"
    echo "   npm start"
    exit 1
fi

echo ""
echo "✅ Configuração completa!"
echo ""
echo "📱 Próximos passos:"
echo "   1. Certifique-se de que o app está rodando no dispositivo"
echo "   2. Balance o dispositivo (ou pressione Ctrl+M)"
echo "   3. Toque em 'Reload' para conectar ao Metro"
echo ""
echo "💡 Se ainda mostrar 'No connected targets':"
echo "   - Recarregue o app novamente"
echo "   - Verifique se o app está aberto na tela"

