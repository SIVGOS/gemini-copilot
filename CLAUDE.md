# Gemini Copilot — Chrome Extension

## Project Overview
A personal-use Chrome Extension (Manifest V3) that opens as a popup on any website, reads the page content, and answers questions using the Google Gemini API. Responses are streamed and rendered as Markdown. Chat history is persisted across sessions via `chrome.storage.local`.

## File Structure

```
copilotExtension/
├── manifest.json          # MV3 manifest — permissions, entry points
├── background.js          # Service worker — owns all Gemini API calls
├── content.js             # Content script — extracts page text for context
├── popup/
│   ├── popup.html         # Chat UI shell
│   ├── popup.css          # Popup styles (includes Markdown styles)
│   ├── popup.js           # Chat logic, storage, copy buttons
│   └── marked.min.js      # Bundled Markdown parser (marked v15, no CDN)
├── options/
│   ├── options.html       # API key settings page
│   └── options.js         # Saves/loads API key via chrome.storage.local
├── icons/                 # 16, 48, 128px PNGs (required by Chrome)
├── CLAUDE.md              # This file
├── SKILLS.md              # Extension feature reference
├── README.md              # User-facing setup and usage guide
└── .gitignore
```

## Key Design Decisions

### Communication Flow
```
popup.js  →  content.js        get page text (chrome.tabs.sendMessage)
popup.js  →  background.js     send chat message (chrome.runtime.Port)
background.js  →  Gemini API   fetch + stream response (SSE)
background.js  →  popup.js     forward streaming tokens via Port
```

### API Key Storage
- Stored in `chrome.storage.local` — never synced to Google account, never exposed to page scripts
- Only `background.js` reads the key; `popup.js` never sees it
- Set via the Options page (right-click extension icon → Options)

### Chat History Persistence
- Stored in `chrome.storage.local` under key `chatHistory`
- Written **only on `STREAM_END`** (once per completed exchange) — no read-modify-write, no race condition
- In-memory `conversationHistory` array is the single source of truth during a session; storage is write-only mid-session
- Capped at 40 entries (~20 exchanges); oldest entries trimmed before each write
- Cleared when the user clicks the ↺ button in the popup

### Markdown Rendering
- `marked.min.js` is bundled locally — no CDN, required by MV3 Content Security Policy
- AI bubble text is stored as raw Markdown in history; re-rendered with `marked.parse()` on load
- Copy button copies raw Markdown text (not rendered HTML) so it pastes cleanly in any editor

### Gemini API
- Model: `gemini-3-flash-preview` (configurable — change `GEMINI_BASE` in `background.js`)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse`
- Page context injected as `system_instruction` on every turn
- Full `conversationHistory` array sent each request (stateless API, multi-turn via client-side history)

### Content Extraction
- `content.js` extracts `document.body.innerText`, collapses whitespace, truncates at 12,000 characters
- Gracefully skips context on `chrome://` pages, `chrome-extension://` pages, and PDFs

## Local Installation

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select this folder
4. Right-click the extension icon → **Options** → paste Gemini API key → Save

## Getting a Gemini API Key
Visit https://aistudio.google.com/app/apikey and create a free API key.

## Debugging
- **Popup**: Right-click the popup → Inspect
- **Service Worker**: `chrome://extensions` → click "service worker" link
- **Content Script**: DevTools on any page → Sources → Content Scripts tab
- **Reload after edits**: `chrome://extensions` → click the ↺ icon on the extension card

## Permissions Used
| Permission | Why |
|---|---|
| `storage` | API key + chat history via `chrome.storage.local` |
| `activeTab` | Read current tab URL/title without broad host permissions |
| `scripting` | MV3 fallback for script injection |
| `host_permissions: generativelanguage.googleapis.com` | Allow `fetch()` to Gemini from service worker |

## Development Notes
- No build step — plain vanilla JS, no npm, no bundler
- Service worker (`background.js`) must NOT use ES module `import` syntax
- Popup lifetime is short; all network calls go through the service worker to avoid interruption
- `marked.min.js` must not be loaded from a CDN — MV3 CSP blocks external scripts in extension pages
