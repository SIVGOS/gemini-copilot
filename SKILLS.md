# Extension Skills & Features

## Core Capabilities

### Page Context Awareness
The extension automatically reads the current page when the popup opens:
- Page title and URL
- Visible body text (up to 12,000 characters)
- This context is sent to Gemini as a system instruction so every answer is page-aware

### Multi-Turn Chat
- Full conversation history is maintained within a popup session
- Ask follow-up questions naturally — Gemini remembers the thread
- "Clear chat" button resets the conversation (keeps page context)

### Streaming Responses
- Responses stream token-by-token from Gemini for a fast, live feel
- Rendered in real time in the message history panel

## Example Prompts

| Goal | Prompt |
|---|---|
| Summarize the page | "Summarize this page in 3 bullet points" |
| Explain a concept | "What does [term on page] mean?" |
| Extract info | "List all the prices mentioned on this page" |
| Compare | "What are the pros and cons mentioned?" |
| Action items | "What are the next steps or calls to action?" |
| General Q&A | "What year was this article published?" |
| Code help | "Explain the code snippet on this page" |

## Settings

### API Key (Options Page)
- Right-click the extension icon → **Options**
- Enter your Gemini API key (get one free at https://aistudio.google.com/app/apikey)
- Key is stored locally in Chrome, never leaves your device except in API calls to Google

## Limitations
- Does not work on `chrome://` pages, `chrome-extension://` pages, or local PDFs
- Page text is truncated at ~12,000 characters on very long pages
- Conversation history is in-memory only — resets when popup closes
- Images and visual content on pages are not sent to Gemini (text only)
- Requires an internet connection to reach the Gemini API

## Keyboard Shortcuts
- `Enter` — Send message
- `Shift+Enter` — New line in input
