// inject the main-world script
const injectee = document.createElement("script");
injectee.src = chrome.runtime.getURL("injection.js");
document.documentElement.appendChild(injectee);
injectee.remove();

// answer queries from main world

window.addEventListener("message", async (event) => {
  //console.log("[Jarvis isolated] heard message:", event.data?.type);
  if (event.data.type === "JARVIS_ANCHOR_QUERY") {
    //console.log("[Jarvis isolated] guard passed, about to read storage");
    try {
      const result = await chrome.storage.local.get([
        event.data.conversationId,
        "responseModes",
      ]);
      const lastDate = result[event.data.conversationId];
      const modes = result["responseModes"] || [];
      console.log("[Jarvis isolated] read ok:", lastDate);
      window.postMessage(
        { type: "JARVIS_ANCHOR_REPLY", id: event.data.id, lastDate, modes },
        "*",
      );
    } catch (e) {
      console.error("[Jarvis isolated] storage read threw:", e);
    }
  }

  if (event.data.type === "JARVIS_ANCHOR_SET") {
    await chrome.storage.local.set({
      [event.data.conversationId]: event.data.date,
    });
    console.log(
      "[Jarvis isolated] sorted",
      event.data.conversationId,
      "=",
      event.data.date,
    );
  }
});
