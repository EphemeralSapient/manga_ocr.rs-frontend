#!/bin/bash

# Quick Fix Script for Extension UI Issues
# Run this if elements are not visible in the popup

echo "==================================="
echo "Manga Extension - Quick Fix Script"
echo "==================================="
echo ""

# 1. Clean build
echo "[1/5] Cleaning previous build..."
rm -rf dist/
echo "✓ Cleaned dist folder"
echo ""

# 2. Rebuild
echo "[2/5] Rebuilding extension..."
if npm run build; then
    echo "✓ Build successful"
else
    echo "✗ Build failed - check errors above"
    exit 1
fi
echo ""

# 3. Verify files exist
echo "[3/5] Verifying build output..."
REQUIRED_FILES=(
    "dist/popup.html"
    "dist/manifest.json"
    "dist/assets/popup-D6N58Con.js"
    "dist/styles/popup-isNzMae5.css"
    "dist/scripts/background.js"
    "dist/scripts/content.js"
)

ALL_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file MISSING"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo ""
    echo "✗ Some files are missing. Build may have failed."
    exit 1
fi
echo ""

# 4. Verify file paths in HTML
echo "[4/5] Checking file paths in popup.html..."
if grep -q 'src="./assets/popup' dist/popup.html && grep -q 'href="./styles/popup' dist/popup.html; then
    echo "✓ Relative paths are correct"
else
    echo "✗ File paths may be incorrect"
    echo "  Check dist/popup.html for absolute paths starting with /"
fi
echo ""

# 5. Check CSS content
echo "[5/5] Verifying CSS file..."
CSS_SIZE=$(wc -c < dist/styles/popup-isNzMae5.css)
if [ "$CSS_SIZE" -gt 1000 ]; then
    echo "✓ CSS file exists and has content ($CSS_SIZE bytes)"
else
    echo "✗ CSS file is too small or empty ($CSS_SIZE bytes)"
fi
echo ""

# Final instructions
echo "==================================="
echo "NEXT STEPS:"
echo "==================================="
echo ""
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. If extension is already loaded:"
echo "   - Click the REFRESH icon on 'Manga Text Processor'"
echo "4. If not loaded yet:"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'dist' folder"
echo ""
echo "5. Test the popup:"
echo "   - Click the extension icon"
echo "   - You should see tabs: Settings, API Keys, Statistics"
echo ""
echo "6. If still not working:"
echo "   - Right-click in popup → Inspect"
echo "   - Check Console tab for errors"
echo "   - Open dist/test-popup.html in browser to test CSS"
echo ""
echo "For detailed troubleshooting: See TROUBLESHOOTING.md"
echo ""
