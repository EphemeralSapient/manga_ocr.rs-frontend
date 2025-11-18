# Installation Guide

## Step-by-Step Extension Installation

### 1. Build the Extension (if not already done)
```bash
# Make sure you're in the project directory
cd /nvme/semp/temp/manga/text_regions_manga/chrome-extension-frontend

# Install dependencies (if not already installed)
npm install

# Build the extension
npm run build
```

**Expected output:**
```
✓ built in XXXms
dist/popup.html
dist/styles/popup-isNzMae5.css
dist/scripts/background.js
dist/scripts/content.js
dist/assets/popup-D6N58Con.js
```

### 2. Verify Build Output
```bash
# Check that dist folder has all required files
ls -la dist/

# Should show:
# - popup.html
# - manifest.json
# - icons/ (directory)
# - assets/ (directory with popup JS)
# - scripts/ (directory with background.js, content.js)
# - styles/ (directory with CSS)
```

### 3. Load Extension in Chrome

1. **Open Chrome Extensions Page:**
   - Navigate to `chrome://extensions/`
   - OR: Menu → Extensions → Manage Extensions

2. **Enable Developer Mode:**
   - Toggle "Developer mode" switch in the top-right corner
   - It should turn blue/on

3. **Load the Extension:**
   - Click "Load unpacked" button
   - **Navigate to the `dist` folder** (NOT the project root!)
     ```
     /nvme/semp/temp/manga/text_regions_manga/chrome-extension-frontend/dist
     ```
   - Click "Select Folder" or "Open"

4. **Verify Installation:**
   - Extension should appear in the list as "Manga Text Processor"
   - Version: 1.0.0
   - No errors shown in red

### 4. Test the Extension

**Method 1: Click the Extension Icon**
1. Look for the extension icon in Chrome toolbar (top-right)
   - If not visible, click the puzzle icon and pin "Manga Text Processor"
2. Click the extension icon
3. Popup should open showing:
   - Server URL input field
   - Keyboard shortcut info banner
   - Three tabs: Settings, API Keys, Statistics
   - Settings content (dropdowns, toggles)

**Method 2: Test with the Test File**
```bash
# Open the test HTML directly in Chrome
google-chrome dist/test-popup.html
# or on Mac:
open dist/test-popup.html
```

If the test file shows all elements correctly, but the extension doesn't, there's a manifest/CSP issue.

### 5. Configure the Extension

Once the popup opens successfully:

1. **Set Server URL** (default: http://localhost:1420)
2. **Add API Keys:**
   - Click "API Keys" tab
   - Click "Add API Key"
   - Paste your Google Gemini API key
   - Can add multiple keys for rotation
3. **Configure Settings:**
   - Choose translation model
   - Enable/disable options as needed

### 6. Use the Extension

1. Open any webpage with manga images
2. Press `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)
3. Extension will process images on the page

## Troubleshooting

### Extension Icon Doesn't Appear
- Check Extensions page (`chrome://extensions/`)
- Verify "Manga Text Processor" is enabled (toggle is on)
- Click puzzle icon → pin the extension

### Popup Doesn't Open When Clicking Icon
- Right-click the extension icon → Inspect popup
- Check Console for errors
- See TROUBLESHOOTING.md for detailed steps

### "Errors" Shown in Extensions Page
- Read the error message
- Common: "manifest.json not found" = you selected wrong folder
  - Should select `dist` folder, not project root
- Click "Details" → "Errors" to see full error

### Elements Not Visible in Popup
1. **Rebuild the extension:**
   ```bash
   npm run build
   ```

2. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Click the refresh icon on "Manga Text Processor"

3. **Clear extension storage:**
   - Right-click extension icon → Manage extension
   - Scroll to "Site access" section
   - Click "Remove" → Re-add extension

4. **Open test file:**
   ```bash
   open dist/test-popup.html
   ```
   If test file works but extension doesn't → manifest issue

5. **Check console for errors:**
   - Click extension icon
   - Right-click in popup → Inspect
   - Check Console tab for red errors

## Updating the Extension

After making code changes:

```bash
# Rebuild
npm run build

# Reload in Chrome
# Go to chrome://extensions/
# Click refresh icon on "Manga Text Processor"
```

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Manga Text Processor"
3. Click "Remove"
4. Confirm removal
