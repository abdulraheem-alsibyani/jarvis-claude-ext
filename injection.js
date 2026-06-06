console.log("[Jarvis] content script loaded on", window.location.href);
const COMPLETION_REGEX =
  /\/api\/organizations\/[^/]+\/chat_conversations\/[^/]+\/completion$/;
const TEST_INJECTION = "[IF YOU SEE THIS JARVIS IS FUNCTIONING]";

function timeTrack() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const injectedTime = `[${hours}:${minutes} ${timezone.split("/").pop()}]`;
  return injectedTime;
}

console.log(timeTrack());
const originalFetch = window.fetch;

function askIsolatedWorld(conversationId) {
  return new Promise((resolve) => {
    const id = crypto.randomUUID();

    function handleReply(event) {
      if (event.data.type === "JARVIS_ANCHOR_REPLY" && event.data.id === id) {
        window.removeEventListener("message", handleReply);
        resolve(event.data.lastDate);
      }
    }

    window.addEventListener("message", handleReply);
    window.postMessage(
      { type: "JARVIS_ANCHOR_QUERY", id: id, conversationId: conversationId },
      "*",
    );
  });
}

window.fetch = async function (...args) {
  try {
    const [resource, init] = args;
    const url = typeof resource === "string" ? resource : resource?.url;
    console.log("[Jarvis] saw request:", url, init?.method, typeof init?.body);

    if (
      url &&
      init &&
      init.method === "POST" &&
      init.body &&
      COMPLETION_REGEX.test(url)
    ) {
      const conversationId = url.match(
        /chat_conversations\/([^/]+)\/completion/,
      )[1];
      console.log(conversationId);
      const parsed = JSON.parse(init.body);
      parsed.prompt = timeTrack() + "\n" + parsed.prompt;
      init.body = JSON.stringify(parsed);
    }
  } catch (err) {
    console.warn("JARVIS injection failed.\nError: ", err);
  }
  return originalFetch.apply(this, args);
};
