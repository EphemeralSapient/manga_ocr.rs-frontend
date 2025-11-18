# Troubleshooting Extension UI Issues

## Quick Diagnosis Steps

### 1. Check Browser Console for Errors
1. Load the extension from the `dist` folder
2. Click the extension icon
3. **Right-click inside the popup** and select "Inspect"
4. Check the **Console** tab for any red errors

### 2. Verify Files Are Loading
In the Console/Network tab, check that these files loaded successfully:
- `popup.html` - Status 200
- `assets/popup-D6N58Con.js` - Status 200
- `styles/popup-isNzMae5.css` - Status 200

### 3. Check DOM Elements
In the **Elements** tab of DevTools:
1. Look for `<nav class="tabs">` - should contain 3 tab buttons
2. Look for `<div class="tab-content">` - should contain 3 tab panels
3. Check if `panel-settings` has class `active` - it should!
4. Check if CSS styles are applied (elements should have colors, padding, etc.)

### 4. Common Issues & Fixes

#### Issue: CSS Not Loading
**Symptoms:** Elements exist but have no styling, everything is unstyled HTML
**Fix:**
```bash
# Rebuild the project
npm run build
# Reload extension in chrome://extensions
```

#### Issue: JavaScript Not Executing
**Symptoms:** Tabs don't switch when clicked, no API key inputs appear
**Console Error:** Look for module loading errors
**Fix:** Check manifest.json points to correct files

#### Issue: Blank Popup
**Symptoms:** Completely white/black popup
**Fix:**
1. Check if you're loading from `dist` folder (NOT root folder)
2. Verify `manifest.json` in dist folder exists
3. Try removing and re-adding the extension

#### Issue: Elements Hidden by CSS
**Fix:** In Console, run:
```javascript
// Check if panel-settings is visible
const panel = document.getElementById('panel-settings');
console.log('Panel element:', panel);
console.log('Panel display:', window.getComputedStyle(panel).display);
console.log('Panel opacity:', window.getComputedStyle(panel).opacity);
```

### 5. Manual Test - Standalone HTML
Open `dist/popup.html` directly in Chrome as a file:
```bash
# From project root
google-chrome dist/popup.html
# or
open dist/popup.html
```

If it works as standalone but not in extension, it's a CSP or manifest issue.

### 6. Verify Build Output
```bash
# Check these files exist:
ls -la dist/popup.html
ls -la dist/assets/popup-D6N58Con.js
ls -la dist/styles/popup-isNzMae5.css
ls -la dist/manifest.json
```

## Expected Behavior

When popup opens, you should see:
1. **Server URL input** at top with status indicator
2. **Keyboard shortcut banner** showing "Ctrl+Shift+M"
3. **Three tabs:** Settings (active/blue), API Keys, Statistics (disabled)
4. **Settings content** showing:
   - Translation Settings (model dropdown)
   - Rendering Options (toggles)
   - Advanced Options (toggles)
5. Clicking "API Keys" tab shows API key management interface

## Still Not Working?

Run these commands and share the output:
```bash
# Check popup.html script paths
grep -E "src=|href=" dist/popup.html

# Check if JavaScript has errors
head -50 dist/assets/popup-D6N58Con.js

# Verify CSS is not empty
wc -l dist/styles/popup-isNzMae5.css
```
