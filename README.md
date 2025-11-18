# Manga Text Processor - Chrome Extension

A modern, professional Chrome extension for processing manga and comic images with automatic text detection, translation, and rendering.

## Features

- 📚 **Process Web Images**: Automatically detect and process manga images on any webpage
- 📁 **Upload & Process**: Process local manga files directly from your computer
- ⚡ **Keyboard Shortcuts**: Quick access with `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)
- 📊 **Analytics Dashboard**: Detailed processing statistics and performance metrics
- 🎨 **Customizable**: Choose fonts and AI models for optimal results
- 🔄 **Real-time Progress**: Live progress updates during processing
- 💾 **Smart Caching**: Efficient caching to minimize API calls

## Architecture

This extension connects to the **Manga Text Processor** Rust backend server, which provides:

1. **Phase 1**: Text detection and segmentation using ONNX models
2. **Phase 2**: Translation using Google Gemini API
3. **Phase 3**: Layout analysis and text positioning
4. **Phase 4**: Text rendering with custom fonts

## Prerequisites

Before using this extension, you need to have the backend server running:

1. **Start the backend server**:
   ```bash
   # From the manga_ocr.rs directory
   cargo run --release
   # Server will start on http://localhost:1420
   ```

2. **Verify server is running**:
   ```bash
   curl http://localhost:1420/health
   ```

## Installation

### Method 1: Load Unpacked Extension (Development)

1. **Clone or download** this repository

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Or click Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the `chrome-extension-frontend` folder
   - The extension icon should appear in your toolbar

5. **Pin the extension** (optional):
   - Click the puzzle icon in the toolbar
   - Pin "Manga Text Processor" for easy access

### Method 2: Pack as .crx (Optional)

1. In `chrome://extensions/`, click "Pack extension"
2. Select the `chrome-extension-frontend` directory
3. Click "Pack Extension"
4. Install the generated `.crx` file

## Configuration

### First-Time Setup

1. **Click the extension icon** in your toolbar
2. **Check server status** - should show "Connected" (green)
3. **Configure settings** (optional):
   - **Font Family**: Choose preferred font (Arial, Comic Sans, Noto Sans Mono CJK)
   - **OCR Model**: Select Gemini model (Flash for speed, Pro for accuracy)

### Server Configuration

If your backend server is running on a different port or host:

1. Click the extension icon
2. Update the **Server URL** field
3. Click **Test Connection** to verify

Default: `http://localhost:1420`

## Usage

### Method 1: Process Images on Current Page

1. **Navigate to a webpage** with manga/comic images
2. **Click the extension icon**
3. **Click "Process Page Images"** button
   - Or use keyboard shortcut: `Ctrl+Shift+M` (Mac: `Cmd+Shift+M`)
4. **Wait for processing** - progress bar will show status
5. **View results** - images on page will be replaced with translated versions

### Method 2: Upload Local Files

1. **Click the extension icon**
2. **Click "Upload & Process"** button
3. **Select images** from your computer (supports .png, .jpg, .jpeg, .webp)
4. **Wait for processing**
5. **View analytics** - processed images will auto-download

### Viewing Analytics

After processing, click **"Stats"** in the footer to view:

- Total images and regions processed
- Background complexity breakdown (simple vs complex)
- API call statistics
- Token usage and costs
- Cache performance (hit rate)
- Processing time breakdown by phase

### Keyboard Shortcuts

- **`Ctrl+Shift+M`** (Mac: `Cmd+Shift+M`): Process images on current page

You can customize this shortcut in Chrome:
1. Go to `chrome://extensions/shortcuts`
2. Find "Manga Text Processor"
3. Click the edit button to change the shortcut

## Features in Detail

### Server Status Indicator

The header displays real-time server connection status:
- 🟢 **Connected**: Server is online and ready
- 🟡 **Checking**: Testing connection
- 🔴 **Offline**: Cannot reach server

### Configuration Panel

Expandable panel with settings:
- **Font Family**: Controls rendered text appearance
- **OCR/Translation Model**: Balances speed vs accuracy
  - `gemini-2.5-flash`: Fastest, good accuracy
  - `gemini-2.5-pro`: Slower, highest accuracy

### Processing Status

Real-time updates during processing:
- Conversion progress (images → blobs)
- Server communication status
- Results application progress

### Analytics Dashboard

Comprehensive statistics:
- **Processing Metrics**: Images, regions, backgrounds
- **API Usage**: Call counts by type
- **Token Usage**: Input/output tokens with totals
- **Cache Performance**: Hits, misses, hit rate percentage
- **Timing Breakdown**: Time spent in each processing phase

## Troubleshooting

### Extension Issues

**Extension icon is grayed out**:
- Check that the backend server is running
- Click "Test Connection" in the popup
- Verify server URL is correct

**"No manga images found"**:
- Extension filters for images larger than 200x200px
- Ensure images are visible on the page
- Try scrolling to load lazy-loaded images

**Images not processing**:
- Check browser console for errors (F12)
- Verify server logs for backend errors
- Ensure you have valid Gemini API keys configured in backend

**CORS errors**:
- Extension handles CORS automatically for web images
- For local files, use the "Upload & Process" feature instead

### Server Issues

**Cannot connect to server**:
```bash
# Check if server is running
curl http://localhost:1420/health

# Start the server
cd manga_ocr.rs
cargo run --release
```

**Server errors during processing**:
- Check backend logs for detailed error messages
- Verify Gemini API keys are configured (`.env.local`)
- Ensure models are loaded correctly

### Performance Issues

**Slow processing**:
- Enable GPU acceleration in backend (see backend README)
- Reduce batch sizes in backend configuration
- Use `gemini-2.5-flash` instead of `pro` model

**High memory usage**:
- Process fewer images at once
- Adjust backend `BATCH_SIZE_N` configuration
- Clear cache: Click "Clear Cache" in footer

## Development

### Project Structure

```
chrome-extension-frontend/
├── manifest.json           # Extension configuration
├── popup.html             # Popup UI structure
├── styles/
│   └── popup.css          # Modern, clean styling
├── scripts/
│   ├── popup.js           # Popup logic and API calls
│   ├── content.js         # Page image processing
│   └── background.js      # Service worker and shortcuts
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── generate-icons.html # Icon generator utility
└── README.md
```

### Key Components

**popup.js**:
- Server connection management
- Settings persistence
- File upload handling
- Analytics display
- Progress tracking

**content.js**:
- Page image detection and filtering
- Image-to-blob conversion
- CORS handling
- Result application
- User notifications

**background.js**:
- Keyboard shortcut handling
- Message forwarding
- Settings initialization

### Modifying the Extension

1. **Edit files** in the extension directory
2. **Reload extension**:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension card
3. **Test changes**:
   - Click extension icon to test popup
   - Use keyboard shortcut to test content script

### Debugging

**Popup debugging**:
- Right-click extension icon → Inspect popup
- View console logs and network requests

**Content script debugging**:
- Open DevTools on any webpage (F12)
- Look for `[CONTENT]` logs in console

**Background worker debugging**:
- Go to `chrome://extensions/`
- Click "Inspect views: service worker"
- Look for `[BACKGROUND]` logs

## API Reference

### Backend Endpoints Used

**`GET /health`**
- Health check endpoint
- Returns 200 if server is ready

**`POST /process`**
- Main processing endpoint
- Accepts multipart/form-data:
  - `images`: Multiple image files
  - `config`: JSON configuration object
- Returns JSON with results and analytics

### Configuration Object

```json
{
  "font_family": "arial",
  "ocr_translation_model": "gemini-2.5-flash"
}
```

**Available fonts**:
- `arial` (default)
- `comic-sans`
- `noto-sans-mono-cjk`

**Available models**:
- `gemini-2.5-flash` (recommended)
- `gemini-2.5-pro`
- `gemini-flash-latest`

## Privacy & Security

- **Local Processing**: All image processing happens on your local server
- **No Data Storage**: Extension doesn't store processed images permanently
- **API Keys**: Managed by backend server, not exposed to extension
- **CORS**: Extension uses standard browser CORS handling
- **Permissions**: Minimal permissions required:
  - `activeTab`: Access current tab content
  - `storage`: Save user preferences
  - `scripting`: Inject content scripts
  - `http://localhost:*`: Connect to local backend server

## Contributing

Contributions welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This extension is part of the Manga Text Processor project. See the main project README for license information.

## Support

For issues and questions:
- **Backend Issues**: Check the main project README
- **Extension Issues**: Check browser console and extension logs
- **API Issues**: Verify Gemini API key and quota

## Changelog

### Version 1.0.0 (Initial Release)
- Modern, professional UI with gradient design
- Real-time server status monitoring
- Page image processing with auto-detection
- Local file upload and processing
- Comprehensive analytics dashboard
- Keyboard shortcuts support
- Progress tracking and notifications
- Settings persistence
- Cache management
- CORS handling for web images

---

**Built with ❤️ for the manga and comic community**
