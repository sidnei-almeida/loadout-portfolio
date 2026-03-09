#!/usr/bin/env bash
# Instala NDK r27d (27.3.13750724) manualmente - necessário quando sdkmanager falha
set -e

ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
NDK_VERSION="27.3.13750724"
NDK_DIR="$ANDROID_HOME/ndk/$NDK_VERSION"
ZIP_URL="https://dl.google.com/android/repository/android-ndk-r27d-linux.zip"
ZIP_FILE="/tmp/android-ndk-r27d-linux.zip"
EXTRACT_DIR="/tmp/android-ndk-extract"

echo "=== Instalando NDK $NDK_VERSION em $NDK_DIR ==="

# Remover instalações corrompidas/antigas
rm -rf "$ANDROID_HOME/ndk/27.1.12297006" 2>/dev/null || true
mkdir -p "$ANDROID_HOME/ndk"

if [ -f "$NDK_DIR/source.properties" ]; then
    echo "NDK $NDK_VERSION já instalado."
    exit 0
fi

echo "Baixando NDK r27d (~634 MB)..."
curl -L -o "$ZIP_FILE" "$ZIP_URL"

echo "Extraindo..."
rm -rf "$EXTRACT_DIR"
mkdir -p "$EXTRACT_DIR"
unzip -q "$ZIP_FILE" -d "$EXTRACT_DIR"

echo "Instalando em $NDK_DIR..."
mv "$EXTRACT_DIR/android-ndk-r27d" "$NDK_DIR"

# Limpar
rm -f "$ZIP_FILE"
rmdir "$EXTRACT_DIR" 2>/dev/null || true

echo "NDK instalado com sucesso!"
ls -la "$NDK_DIR/source.properties"
