// Service worker — handles all Gemini API calls.
// Communicates with popup.js via a long-lived Port.

// Cross-browser API compatibility (Chrome uses `chrome`, Safari/Firefox use `browser`)
const api = typeof browser !== "undefined" ? browser : chrome; // eslint-disable-line no-undef

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview";

api.runtime.onConnect.addListener((port) => {
  if (port.name !== "gemini-chat") return;

  port.onMessage.addListener(async (message) => {
    if (message.type === "SEND_MESSAGE") {
      await handleChatMessage(port, message);
    }
  });
});

async function handleChatMessage(port, message) {
  const { history, pageContext } = message;

  // Retrieve API key
  const { geminiApiKey } = await api.storage.local.get("geminiApiKey");
  if (!geminiApiKey) {
    port.postMessage({ type: "ERROR", error: "No API key set. Open Options to add your Gemini API key." });
    return;
  }

  // Build system instruction with page context
  let systemText = "You are a helpful assistant embedded in a browser extension. Answer the user's questions clearly and concisely.";
  if (pageContext && pageContext.url) {
    systemText += `\n\nThe user is currently viewing a webpage:`;
    systemText += `\nTitle: ${pageContext.title || "(no title)"}`;
    systemText += `\nURL: ${pageContext.url}`;
    if (pageContext.bodyText) {
      systemText += `\n\nPage content:\n${pageContext.bodyText}`;
    }
  }

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemText }]
    },
    contents: history,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  const url = `${GEMINI_BASE}:streamGenerateContent?alt=sse&key=${geminiApiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Gemini API error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errMsg;
      } catch (_) {}
      port.postMessage({ type: "ERROR", error: errMsg });
      return;
    }

    // Stream the SSE response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    port.postMessage({ type: "STREAM_START" });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const chunk = JSON.parse(jsonStr);
          const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            port.postMessage({ type: "STREAM_CHUNK", text });
          }
        } catch (_) {
          // Ignore malformed chunks
        }
      }
    }

    port.postMessage({ type: "STREAM_END" });
  } catch (err) {
    port.postMessage({ type: "ERROR", error: err.message || "Network error reaching Gemini API." });
  }
}
