console.log("[Jarvis] content script loaded on", window.location.href);
const COMPLETION_REGEX =
  /\/api\/organizations\/[^/]+\/chat_conversations\/[^/]+\/completion$/;
const TEST_INJECTION = "[IF YOU SEE THIS JARVIS IS FUNCTIONING]";

const originalFetch = window.fetch;

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
      const parsed = JSON.parse(init.body);
      parsed.prompt = TEST_INJECTION + "\n" + parsed.prompt;
      init.body = JSON.stringify(parsed);
    }
  } catch (err) {
    console.warn("JARVIS injection failed.\nError: ", err);
  }
  return originalFetch.apply(this, args);
};
