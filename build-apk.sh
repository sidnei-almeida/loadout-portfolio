#!/bin/bash
# Build React Native APK (debug or release).
# Release APK is standalone: users install and run without Metro.
# Usage: ./build-apk.sh [debug|release] [--clean]
#
# --clean: remove local build dirs (avoids broken "gradlew clean" with RN native code).
# If you see CMake "non-existent path" errors, run: ./build-apk.sh release --clean

set -e

BUILD_TYPE=${1:-release}
CLEAN_FLAG=${2:-}

cd android

if [ "$CLEAN_FLAG" = "--clean" ]; then
    echo "Removing local build artifacts (app/.cxx, app/build, build)..."
    rm -rf app/.cxx app/build build
fi

if [ "$BUILD_TYPE" = "release" ]; then
    echo "Building RELEASE APK (standalone, no Metro required)..."
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    echo "Done. APK: android/${APK_PATH}"
    echo ""
    echo "This APK can be shared with testers. They install and run it; Metro is not needed."
else
    echo "Building DEBUG APK..."
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    echo "Done. APK: android/${APK_PATH}"
fi

echo ""
echo "Install on device: adb install android/${APK_PATH}"
echo "Or copy android/${APK_PATH} to the device and open it to install."

cd ..
