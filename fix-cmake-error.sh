#!/bin/bash

# Script para corrigir erros de CMake relacionados a codegen

echo "🔧 Corrigindo erros de CMake (codegen)..."
echo ""

cd /home/sidnei/Documentos/GitHub/SkinfolioRN || exit 1

# 1. Limpar cache do CMake e build
echo "🧹 Limpando cache do CMake..."
rm -rf android/app/.cxx android/app/build android/.gradle 2>/dev/null

# 2. Limpar build do Gradle
echo "🧹 Limpando build do Gradle..."
cd android
./gradlew clean > /dev/null 2>&1

# 3. Gerar arquivos de autolinking primeiro
echo "📝 Gerando arquivos de autolinking..."
./gradlew app:generateAutolinkingNewArchitectureFiles app:generateAutolinkingPackageList > /dev/null 2>&1

# 4. Gerar código nativo para todas as bibliotecas
echo "📦 Gerando código nativo para bibliotecas..."
./gradlew \
  react-native-async-storage_async-storage:generateCodegenArtifactsFromSchema \
  react-native-clipboard_clipboard:generateCodegenArtifactsFromSchema \
  react-native-gesture-handler:generateCodegenArtifactsFromSchema \
  react-native-picker_picker:generateCodegenArtifactsFromSchema \
  2>&1 | grep -E "(BUILD|Task|ERROR|FAILED)" | tail -10

# 5. Criar diretórios codegen se não existirem (workaround)
echo "🔨 Criando diretórios codegen se necessário..."
cd ..
mkdir -p node_modules/@react-native-async-storage/async-storage/android/build/generated/source/codegen/jni/ 2>/dev/null
mkdir -p node_modules/@react-native-clipboard/clipboard/android/build/generated/source/codegen/jni/ 2>/dev/null
mkdir -p node_modules/react-native-gesture-handler/android/build/generated/source/codegen/jni/ 2>/dev/null
mkdir -p node_modules/react-native-webview/android/build/generated/source/codegen/jni/ 2>/dev/null

# Criar CMakeLists.txt vazio em cada diretório se não existir
for dir in \
  "node_modules/@react-native-async-storage/async-storage/android/build/generated/source/codegen/jni" \
  "node_modules/@react-native-clipboard/clipboard/android/build/generated/source/codegen/jni" \
  "node_modules/react-native-gesture-handler/android/build/generated/source/codegen/jni" \
  "node_modules/react-native-webview/android/build/generated/source/codegen/jni"
do
  if [ -d "$dir" ]; then
    if [ ! -f "$dir/CMakeLists.txt" ]; then
      echo "# Empty CMakeLists.txt - will be generated during build" > "$dir/CMakeLists.txt"
    fi
  fi
done

echo ""
echo "✅ Correção aplicada!"
echo ""
echo "📝 Agora tente rodar o app novamente no Android Studio"
echo "   ou execute: cd android && ./gradlew assembleDebug"
echo ""

