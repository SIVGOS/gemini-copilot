# Gemini Copilot

A personal browser extension that lets you chat with Google Gemini about any webpage you're browsing. Ask it to summarize, explain, extract, or answer questions — with full context of the current page.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)
![Safari Extension](https://img.shields.io/badge/Safari-Extension-blue?logo=safari)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![No Build Step](https://img.shields.io/badge/Build-None%20required-lightgrey)

---

## Features

- **Page-aware chat** — automatically reads the current page title, URL, and content
- **Streaming responses** — answers appear token by token, just like ChatGPT
- **Markdown rendering** — bold, code blocks, lists, tables all render properly
- **Persistent history** — conversation survives closing and reopening the popup
- **Copy button** — hover any message to copy its raw text to clipboard
- **No build step** — plain vanilla JS, load directly in your browser

---

## Prerequisites

- Google Chrome, Safari 16+, or any Chromium-based browser
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/gemini-copilot.git
cd gemini-copilot
```

### 2. Load the extension in your browser

**Chrome / Chromium-based browsers**
1. Go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked** → select the cloned `gemini-copilot` folder

**Safari**
1. Open **Safari** → **Develop** menu → **Show Extension Builder**
   *(enable the Develop menu in Safari → Settings → Advanced → Show Develop menu)*
2. Click **+** → **Add Extension** → select the cloned `gemini-copilot` folder
3. Click **Run** to load the extension
4. Go to **Safari → Settings → Extensions** and enable **Gemini Copilot**

The extension icon will appear in your browser toolbar.

### 3. Add your Gemini API key

1. Right-click the extension icon → **Options**
   *(or click the icon → ⚙ Settings button)*
2. Paste your Gemini API key into the input field
3. Click **Save**

Your key is stored locally in your browser and never leaves your device except in direct API calls to Google.

---

## Usage

1. Navigate to any webpage
2. Click the **Gemini Copilot** icon in the toolbar
3. Type a question and press **Enter**

### Example prompts

| Goal | Prompt |
|---|---|
| Summarize | "Summarize this page in 3 bullet points" |
| Explain | "What does [term] mean in this context?" |
| Extract | "List all the prices mentioned on this page" |
| Code help | "Explain the code snippet on this page" |
| Action items | "What are the next steps or calls to action?" |

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Enter` | Send message |
| `Shift+Enter` | New line in input |

### Copy a message

Hover over any message bubble — a copy icon appears below it. Click to copy the raw text (Markdown-formatted) to your clipboard. The icon turns green ✓ to confirm.

### Clear chat history

Click the **↺** button in the popup header. This clears both the on-screen conversation and the saved history in storage.

---

## Project Structure

```
gemini-copilot/
├── manifest.json       # Browser Extension Manifest V3
├── background.js       # Service worker — Gemini API calls + streaming
├── content.js          # Content script — extracts page text
├── popup/
│   ├── popup.html      # Chat UI
│   ├── popup.css       # Styles
│   ├── popup.js        # Chat logic, history, copy buttons
│   └── marked.min.js   # Bundled Markdown parser
├── options/
│   ├── options.html    # Settings page
│   └── options.js      # API key management
└── icons/              # Extension icons (16, 48, 128px)
```

---

## Configuration

### Changing the Gemini model

Edit the first line of `background.js`:

```js
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview";
```

Replace `gemini-3-flash-preview` with any model available to your API key.

### Adjusting history limit

Edit `popup.js`:

```js
const HISTORY_CAP = 40; // max entries (~20 exchanges)
```

### Adjusting page content limit

Edit `content.js`:

```js
const MAX_TEXT_LENGTH = 12000;
```

---

## Limitations

- Does not work on browser internal pages (`chrome://`, `safari://`, extension pages) or local PDFs
- Page content is text-only — images and visual elements are not sent to Gemini
- Conversation history resets context on page change (page context is always re-read from the live tab)
- Requires an internet connection to reach the Gemini API

---

## Privacy

- Your Gemini API key is stored only in browser local storage on your device
- Page content and chat messages are sent to Google's Gemini API — review [Google's privacy policy](https://policies.google.com/privacy) for details
- No data is sent to any server other than `generativelanguage.googleapis.com`

---

## License

MIT
