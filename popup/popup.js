// popup.js — orchestrates the chat UI

// Cross-browser API compatibility (Chrome uses `chrome`, Safari/Firefox use `browser`)
const api = typeof browser !== "undefined" ? browser : chrome; // eslint-disable-line no-undef

const messagesEl = document.getElementById("messages");
const userInput  = document.getElementById("user-input");
const btnSend    = document.getElementById("btn-send");
const btnClear   = document.getElementById("btn-clear");
const btnOptions = document.getElementById("btn-options");
const pageTitleDisplay = document.getElementById("page-title-display");

const HISTORY_CAP = 40; // max entries (~20 exchanges)

const SVG_COPY  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const SVG_CHECK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4caf78" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

marked.setOptions({ breaks: true, gfm: true });

// Conversation history in Gemini format: [{role, parts: [{text}]}]
let conversationHistory = [];
let pageContext  = null;
let port         = null;
let isStreaming  = false;

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  connectPort();
  await Promise.all([loadChatHistory(), loadPageContext()]);
  if (conversationHistory.length === 0) {
    addSystemMessage("Page loaded. Ask me anything about it.");
  }
}

// ── Storage ───────────────────────────────────────────────────────────────

async function loadChatHistory() {
  const { chatHistory } = await api.storage.local.get("chatHistory");
  if (!chatHistory?.length) return;

  conversationHistory = chatHistory;
  for (const entry of chatHistory) {
    createBubble(entry.role === "user" ? "user" : "ai", entry.parts[0].text);
  }
  scrollToBottom();
}

function saveChatHistory() {
  // Trim in-memory array to cap, then write the full array atomically
  if (conversationHistory.length > HISTORY_CAP) {
    conversationHistory = conversationHistory.slice(-HISTORY_CAP);
  }
  api.storage.local.set({ chatHistory: conversationHistory });
}

// ── Port ──────────────────────────────────────────────────────────────────

function connectPort() {
  port = api.runtime.connect({ name: "gemini-chat" });
  port.onDisconnect.addListener(() => {
    port = null;
    setTimeout(connectPort, 200);
  });
  port.onMessage.addListener(handlePortMessage);
}

// ── Page context ──────────────────────────────────────────────────────────

async function loadPageContext() {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("no tab");

    const ctx = await api.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTEXT" });
    pageContext = ctx;

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = "📄";
    pageTitleDisplay.innerHTML = "";
    pageTitleDisplay.appendChild(label);
    pageTitleDisplay.appendChild(
      document.createTextNode(ctx.title || ctx.url || "Unknown page")
    );
  } catch (_) {
    pageContext = null;
    pageTitleDisplay.textContent = "⚠ Could not read page (chrome:// or PDF)";
  }
}

// ── Port message handler ──────────────────────────────────────────────────

let currentAiBubble = null;
let streamingRawText = "";

function handlePortMessage(msg) {
  switch (msg.type) {
    case "STREAM_START": {
      streamingRawText = "";
      const wrap = document.createElement("div");
      wrap.className = "message-wrap ai";
      currentAiBubble = document.createElement("div");
      currentAiBubble.className = "message ai markdown-body";
      wrap.appendChild(currentAiBubble);
      messagesEl.appendChild(wrap);
      scrollToBottom();
      break;
    }

    case "STREAM_CHUNK": {
      if (!currentAiBubble) break;
      streamingRawText += msg.text;
      currentAiBubble.innerHTML =
        marked.parse(streamingRawText) +
        '<span class="cursor" id="stream-cursor"></span>';
      scrollToBottom();
      break;
    }

    case "STREAM_END": {
      if (!currentAiBubble) break;
      currentAiBubble.innerHTML = marked.parse(streamingRawText);
      // Append copy button to the wrapper
      currentAiBubble.parentElement.appendChild(makeCopyBtn(streamingRawText));

      conversationHistory.push({ role: "model", parts: [{ text: streamingRawText }] });
      saveChatHistory(); // write only here — once per completed exchange

      currentAiBubble = null;
      streamingRawText = "";
      setStreaming(false);
      break;
    }

    case "ERROR": {
      currentAiBubble?.parentElement?.remove();
      currentAiBubble = null;
      streamingRawText = "";
      addSystemMessage("⚠ " + msg.error);
      setStreaming(false);
      break;
    }
  }
}

// ── Send ──────────────────────────────────────────────────────────────────

function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isStreaming) return;

  createBubble("user", text);
  conversationHistory.push({ role: "user", parts: [{ text }] });
  userInput.value = "";
  autoResizeTextarea();
  setStreaming(true);

  if (!port) connectPort();
  port.postMessage({ type: "SEND_MESSAGE", history: conversationHistory, pageContext });
}

// ── UI helpers ────────────────────────────────────────────────────────────

function makeCopyBtn(rawText) {
  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.title = "Copy";
  btn.innerHTML = SVG_COPY;
  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(rawText).then(() => {
      btn.innerHTML = SVG_CHECK;
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = SVG_COPY;
        btn.classList.remove("copied");
      }, 2000);
    });
  });
  return btn;
}

// Creates a message bubble + copy button inside a .message-wrap
function createBubble(role, rawText) {
  const wrap = document.createElement("div");
  wrap.className = `message-wrap ${role}`;

  const bubble = document.createElement("div");
  if (role === "ai") {
    bubble.className = "message ai markdown-body";
    bubble.innerHTML = marked.parse(rawText);
  } else {
    bubble.className = "message user";
    bubble.textContent = rawText;
  }

  wrap.appendChild(bubble);
  wrap.appendChild(makeCopyBtn(rawText));
  messagesEl.appendChild(wrap);
  return wrap;
}

function addSystemMessage(text) {
  const el = document.createElement("div");
  el.className = "message system";
  el.textContent = text;
  messagesEl.appendChild(el);
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setStreaming(val) {
  isStreaming = val;
  btnSend.disabled = val;
  userInput.disabled = val;
}

function autoResizeTextarea() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 80) + "px";
}

// ── Events ────────────────────────────────────────────────────────────────

btnSend.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

userInput.addEventListener("input", autoResizeTextarea);

btnClear.addEventListener("click", () => {
  conversationHistory = [];
  api.storage.local.remove("chatHistory");
  messagesEl.innerHTML = "";
  addSystemMessage("Chat cleared. Page context retained.");
});

btnOptions.addEventListener("click", () => {
  api.runtime.openOptionsPage();
});

// ── Boot ──────────────────────────────────────────────────────────────────
init();
