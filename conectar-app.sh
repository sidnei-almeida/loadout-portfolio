#!/bin/bash
# Script rápido para conectar o app ao Metro

echo "🔌 Conectando app ao Metro..."
echo ""

# 1. Configurar port forwarding
echo "1️⃣ Configurando port forwarding..."
adb reverse tcp:8081 tcp:8081

if [ $? -eq 0 ]; then
    echo "✅ Port forwarding configurado"
else
    echo "❌ Erro ao configurar port forwarding"
    exit 1
fi

echo ""
echo "2️⃣ Abrindo menu dev no dispositivo..."
echo "   (Se não abrir automaticamente, balance o celular manualmente)"
adb shell input keyevent 82

echo ""
echo "✅ Passos concluídos!"
echo ""
echo "📱 No dispositivo:"
echo "   1. Toque em 'Reload' no menu que apareceu"
echo "   2. Aguarde o app recarregar"
echo "   3. Pressione 'j' no terminal do Metro para abrir DevTools"
echo ""
