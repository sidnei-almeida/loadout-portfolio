#!/bin/bash

# Script para configurar DevTools do React Native no Linux
# Configura variáveis de ambiente para usar Brave/Chrome

echo "🔧 Configurando React Native DevTools..."
echo ""

# Verificar qual navegador está disponível
# Prioridade: binário real do brave-bin (Arch) > wrapper /usr/bin/brave
if [ -x /opt/brave-bin/brave ]; then
    BROWSER="brave"
    BROWSER_PATH="/opt/brave-bin/brave"
    echo "✅ Brave (brave-bin) encontrado: $BROWSER_PATH"
elif command -v brave &> /dev/null; then
    BROWSER="brave"
    BROWSER_PATH=$(which brave)
    echo "✅ Brave encontrado: $BROWSER_PATH"
elif command -v google-chrome &> /dev/null; then
    BROWSER="google-chrome"
    BROWSER_PATH=$(which google-chrome)
    echo "✅ Google Chrome encontrado: $BROWSER_PATH"
elif command -v chromium &> /dev/null; then
    BROWSER="chromium"
    BROWSER_PATH=$(which chromium)
    echo "✅ Chromium encontrado: $BROWSER_PATH"
else
    echo "⚠️  Nenhum navegador Chromium encontrado!"
    echo "   Instale Brave, Chrome ou Chromium para usar DevTools"
    exit 1
fi

# Configurar variáveis de ambiente para esta sessão
# EDGE_PATH e CHROME_PATH são usados pelo React Native DevTools
export CHROME_PATH="$BROWSER_PATH"
export EDGE_PATH="$BROWSER_PATH"
export REACT_EDITOR="$BROWSER"
export REACT_NATIVE_EDITOR="$BROWSER"

echo ""
echo "✅ Variáveis configuradas para esta sessão:"
echo "   CHROME_PATH=$CHROME_PATH"
echo "   EDGE_PATH=$EDGE_PATH"
echo "   REACT_EDITOR=$REACT_EDITOR"
echo ""
echo "💡 Para configurar permanentemente, adicione ao seu ~/.bashrc ou ~/.zshrc:"
echo "   export CHROME_PATH=\"$BROWSER_PATH\""
echo "   export EDGE_PATH=\"$BROWSER_PATH\""
echo "   export REACT_EDITOR=\"$BROWSER\""
echo "   export REACT_NATIVE_EDITOR=\"$BROWSER\""
echo ""

