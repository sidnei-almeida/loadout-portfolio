#!/bin/bash

# Script para baixar e configurar as fontes do Google Fonts

FONTS_DIR="./assets/fonts"
ANDROID_FONTS_DIR="./android/app/src/main/assets/fonts"

# Criar diretórios se não existirem
mkdir -p "$FONTS_DIR"
mkdir -p "$ANDROID_FONTS_DIR"

echo "📥 Baixando fontes do Google Fonts..."

# Função para baixar fontes do Google Fonts
download_font() {
    local font_name=$1
    local font_file=$2
    local url="https://github.com/google/fonts/raw/main/ofl/${font_name}/${font_file}"
    
    echo "  → Baixando $font_file..."
    curl -L -o "$FONTS_DIR/$font_file" "$url" 2>/dev/null
    
    if [ -f "$FONTS_DIR/$font_file" ]; then
        echo "  ✅ $font_file baixado com sucesso"
        cp "$FONTS_DIR/$font_file" "$ANDROID_FONTS_DIR/$font_file"
    else
        echo "  ❌ Erro ao baixar $font_file"
    fi
}

# Orbitron
echo ""
echo "🎯 Baixando Orbitron..."
download_font "orbitron" "Orbitron-Regular.ttf"
download_font "orbitron" "Orbitron-Medium.ttf"
download_font "orbitron" "Orbitron-SemiBold.ttf"
download_font "orbitron" "Orbitron-Bold.ttf"
download_font "orbitron" "Orbitron-ExtraBold.ttf"
download_font "orbitron" "Orbitron-Black.ttf"

# Rajdhani
echo ""
echo "🎯 Baixando Rajdhani..."
download_font "rajdhani" "Rajdhani-Light.ttf"
download_font "rajdhani" "Rajdhani-Regular.ttf"
download_font "rajdhani" "Rajdhani-Medium.ttf"
download_font "rajdhani" "Rajdhani-SemiBold.ttf"
download_font "rajdhani" "Rajdhani-Bold.ttf"

# JetBrains Mono
echo ""
echo "🎯 Baixando JetBrains Mono..."
download_font "jetbrainsmono" "JetBrainsMono-Regular.ttf"
download_font "jetbrainsmono" "JetBrainsMono-Bold.ttf"

echo ""
echo "✅ Fontes baixadas e configuradas!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Execute: cd android && ./gradlew clean && cd .."
echo "   2. Execute: npx react-native run-android"
echo ""

