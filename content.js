// inject the main-world script
const injectee = document.createElement("script");
injectee.src = chrome.runtime.getURL("injection.js");
document.documentElement.appendChild(injectee);
injectee.remove();

// answer queries from main world

window.addEventListener("message", async (event) => {
  if (event.data.type === "JARVIS_ANCHOR_QUERY") {
    const result = await chrome.storage.local.get(event.data.conversationId);
    const lastDate = result[event.get.conversationId];
    window.postMessage(
      { type: "JARVIS_ANCHOR_REPLY", id: event.data.id, lastDate: lastDate },
      "*",
    );
  }
});
