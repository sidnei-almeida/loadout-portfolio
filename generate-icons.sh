#!/bin/bash

# Script para gerar todos os tamanhos de ícone a partir de um arquivo base
# Uso: ./generate-icons.sh icon/Rajdhani.png

if [ -z "$1" ]; then
    echo "❌ Erro: Forneça o caminho do ícone base"
    echo "Uso: ./generate-icons.sh icon/Rajdhani.png"
    exit 1
fi

ICON_BASE="$1"

if [ ! -f "$ICON_BASE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $ICON_BASE"
    exit 1
fi

echo "🎨 Gerando ícones a partir de: $ICON_BASE"
echo ""

# Verificar se ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick não encontrado!"
    echo "   Instale com: sudo pacman -S imagemagick"
    echo ""
    echo "   Ou use uma ferramenta online: https://www.appicongenerator.org/"
    exit 1
fi

# Criar diretórios se não existirem
mkdir -p ios/Loadout/Images.xcassets/AppIcon.appiconset
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

echo "📱 Gerando ícones iOS..."

# iOS - Gerar todos os tamanhos
magick "$ICON_BASE" -resize 40x40 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-20@2x.png
magick "$ICON_BASE" -resize 60x60 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-20@3x.png
magick "$ICON_BASE" -resize 58x58 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-29@2x.png
magick "$ICON_BASE" -resize 87x87 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-29@3x.png
magick "$ICON_BASE" -resize 80x80 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-40@2x.png
magick "$ICON_BASE" -resize 120x120 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-40@3x.png
magick "$ICON_BASE" -resize 120x120 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-60@2x.png
magick "$ICON_BASE" -resize 180x180 ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-60@3x.png
# App Store - 1024x1024 (sem transparência para iOS)
magick "$ICON_BASE" -resize 1024x1024 -background white -alpha remove ios/Loadout/Images.xcassets/AppIcon.appiconset/icon-1024.png

echo "✅ Ícones iOS gerados!"

echo ""
echo "🤖 Gerando ícones Android..."

# Android - Gerar todos os tamanhos
magick "$ICON_BASE" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
magick "$ICON_BASE" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
magick "$ICON_BASE" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
magick "$ICON_BASE" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
magick "$ICON_BASE" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Android Round - Mesmos tamanhos
magick "$ICON_BASE" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
magick "$ICON_BASE" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
magick "$ICON_BASE" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
magick "$ICON_BASE" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
magick "$ICON_BASE" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

echo "✅ Ícones Android gerados!"

echo ""
echo "🎉 Todos os ícones foram gerados com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. iOS: Abra o projeto no Xcode e verifique se os ícones aparecem corretamente"
echo "   2. Android: Faça rebuild: cd android && ./gradlew clean && cd .. && npx react-native run-android"
echo "   3. Teste em dispositivos reais para garantir que os ícones estão corretos"
echo ""
