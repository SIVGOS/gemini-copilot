// Cross-browser API compatibility (Chrome uses `chrome`, Safari/Firefox use `browser`)
const api = typeof browser !== "undefined" ? browser : chrome; // eslint-disable-line no-undef

const apiKeyInput = document.getElementById("api-key-input");
const btnSave = document.getElementById("btn-save");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggle-visibility");

// Load existing key on open
api.storage.local.get("geminiApiKey").then(({ geminiApiKey }) => {
  if (geminiApiKey) {
    apiKeyInput.value = geminiApiKey;
  }
});

// Show/hide key toggle
toggleBtn.addEventListener("click", () => {
  const isHidden = apiKeyInput.type === "password";
  apiKeyInput.type = isHidden ? "text" : "password";
  toggleBtn.textContent = isHidden ? "Hide key" : "Show key";
});

// Save key
btnSave.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    showStatus("Please enter an API key.", "error");
    return;
  }

  if (!key.startsWith("AIza")) {
    showStatus("Key should start with 'AIza'. Double-check it.", "error");
    return;
  }

  api.storage.local.set({ geminiApiKey: key }).then(() => {
    showStatus("Saved!", "success");
  });
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = type;
  clearTimeout(showStatus._timer);
  showStatus._timer = setTimeout(() => {
    statusEl.textContent = "";
    statusEl.className = "";
  }, 3000);
}
