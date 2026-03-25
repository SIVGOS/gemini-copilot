// Content script — injected into every page.
// Responds to requests for page context from popup.js.

const MAX_TEXT_LENGTH = 12000;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "GET_PAGE_CONTEXT") return false;

  const title = document.title || "";
  const url = window.location.href || "";

  let bodyText = "";
  try {
    bodyText = document.body.innerText || "";
    // Collapse excessive whitespace
    bodyText = bodyText.replace(/\s{3,}/g, "\n\n").trim();
    if (bodyText.length > MAX_TEXT_LENGTH) {
      bodyText = bodyText.slice(0, MAX_TEXT_LENGTH) + "\n\n[Content truncated for length...]";
    }
  } catch (_) {
    bodyText = "";
  }

  sendResponse({ title, url, bodyText });
  return true; // Keep the message channel open for async response
});
