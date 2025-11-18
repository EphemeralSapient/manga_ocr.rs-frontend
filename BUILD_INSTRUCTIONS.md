# Build & Installation Instructions

## Quick Start

### Development Build
```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Output will be in dist/ folder
```

### Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project

### Development Workflow
```bash
# Watch mode - rebuilds on file changes
npm run dev

# After changes, reload the extension in Chrome
# (click the reload icon on the extension card)
```

## Available Scripts

- `npm run build` - Production build with minification
- `npm run dev` - Watch mode for development
- `npm run type-check` - TypeScript type checking without emitting
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Requirements

- Node.js 18+ or higher
- npm 7+ or higher
- Chrome 88+ or other Chromium-based browser

## Folder Structure

```
chrome-extension-frontend/
├── dist/                   # Build output (generated)
│   ├── manifest.json
│   ├── popup.html
│   ├── icons/
│   ├── scripts/
│   │   ├── background.js
│   │   └── content.js
│   ├── styles/
│   └── assets/
├── src/                    # Source code
│   ├── popup.ts
│   ├── background.ts
│   ├── content.ts
│   ├── types/
│   ├── utils/
│   └── styles/
├── popup.html              # HTML template
├── manifest.json           # Extension manifest
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Troubleshooting

### Build fails with TypeScript errors
```bash
# Check types without building
npm run type-check

# If you see errors, fix them in the source files
# Common issues: unused variables, type mismatches
```

### Extension doesn't load
1. Check that you selected the `dist/` folder, not the root folder
2. Ensure build completed successfully (check for `dist/manifest.json`)
3. Check Chrome DevTools console for errors

### Changes not appearing
1. Make sure you ran `npm run build` or have `npm run dev` running
2. Click the reload icon on the extension card in `chrome://extensions/`
3. Close and reopen the popup

### Server connection fails
1. Ensure your local manga processing server is running on `http://localhost:1420`
2. Check server URL in extension settings
3. Verify server is healthy (visit `http://localhost:1420/health`)

## First Time Setup

After loading the extension:

1. **Configure Server URL**: Default is `http://localhost:1420`
2. **Add API Keys**: Go to "API Keys" tab and add at least one Gemini API key
3. **Adjust Settings**: Customize translation model and rendering options
4. **Test**: Visit a page with manga images and click "Process Page"

## Getting API Keys

Get a free Gemini API key from:
https://makersuite.google.com/app/apikey

## Support

See REDESIGN.md for detailed documentation on all features and improvements.
