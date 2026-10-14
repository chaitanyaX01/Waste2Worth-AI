#!/usr/bin/env bash
# Waste2Worth Android APK Build Automation Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "      Waste2Worth Android Mobile Application Build        "
echo "=========================================================="

echo "[1/4] Checking Development Environment Prerequisites..."

MISSING_TOOLS=0

if command -v flutter >/dev/null 2>&1; then
    FLUTTER_VERSION=$(flutter --version | head -n 1)
    echo "  ✓ Flutter found: $FLUTTER_VERSION"
else
    echo "  ✗ Flutter SDK not found on PATH!"
    MISSING_TOOLS=1
fi

if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "  ✓ Java runtime found: $JAVA_VERSION"
else
    echo "  ✗ Java JDK (OpenJDK 17 recommended) not found!"
    MISSING_TOOLS=1
fi

if [ $MISSING_TOOLS -ne 0 ]; then
    echo ""
    echo "=========================================================="
    echo "  PREREQUISITES INSTALLATION INSTRUCTIONS (macOS)"
    echo "=========================================================="
    echo "To install Flutter and Java on macOS using Homebrew, run:"
    echo ""
    echo "  brew install --cask flutter"
    echo "  brew install openjdk@17"
    echo "  brew install --cask android-studio"
    echo ""
    echo "Or download Flutter directly from: https://docs.flutter.dev/get-started/install/macos"
    echo "Ensure Flutter is added to your PATH (~/.zshrc):"
    echo "  export PATH=\"\$PATH:/path/to/flutter/bin\""
    echo "  export JAVA_HOME=\"/opt/homebrew/opt/openjdk@17\""
    echo "=========================================================="
    exit 1
fi

echo "[2/4] Resolving Flutter Dependencies..."
flutter pub get

echo "[3/4] Running Static Analysis..."
flutter analyze || echo "Static analysis finished with suggestions."

echo "[4/4] Compiling Android Debug APK..."
flutter build apk --debug

OUTPUT_APK="$SCRIPT_DIR/build/app/outputs/flutter-apk/app-debug.apk"

if [ -f "$OUTPUT_APK" ]; then
    echo ""
    echo "=========================================================="
    echo "  BUILD SUCCEEDED! APK READY FOR INSTALLATION:"
    echo "  $OUTPUT_APK"
    echo "=========================================================="
    echo "To install on a connected Android phone or emulator:"
    echo "  adb install -r $OUTPUT_APK"
    echo "=========================================================="
else
    echo "Build completed, check build/app/outputs/flutter-apk/ for output."
fi
