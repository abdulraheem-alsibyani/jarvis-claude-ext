console.log("[Jarvis] content script loaded on", window.location.href);
const COMPLETION_REGEX =
  /\/api\/organizations\/[^/]+\/chat_conversations\/[^/]+\/completion$/;
const TEST_INJECTION = "[IF YOU SEE THIS JARVIS IS FUNCTIONING]";

function timeTrack() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const injectedTime = `${hours}:${minutes} ${timezone.split("/").pop()}`;
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
        resolve({ lastDate: event.data.lastDate, modes: event.data.modes });
      }
    }

    window.addEventListener("message", handleReply);
    window.postMessage(
      { type: "JARVIS_ANCHOR_QUERY", id: id, conversationId: conversationId },
      "*",
    );
  });
}

function todayString() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = String(today.getFullYear());
  return `${day}-${month}-${year}`;
}

function readVarint(bytes, offset) {
  let result = 0n;
  let shift = 0n;
  let pos = offset;
  while (true) {
    const b = bytes[pos];
    result |= BigInt(b & 0x7f) << shift;
    pos++;
    if ((b & 0x80) === 0) break;
    shift += 7n;

    return { value: result, next: pos };
  }

  function writeVarint(value) {
    let v = BigInt(value);
    const out = [];
    while (true) {
      let byte = Number(v & 0x7fn);
      v >>= 7n;
      if (v !== 0n) {
        out.push(byte | 0x80n);
      } else {
        out.push(byte);
        break;
      }
    }
    return new Uint8Array(out);
  }
}
function walkFields(bytes, start, end) {
  const fields = [];
  let pos = start;
  while (pos < end) {
    const tagStart = pos;
    const { value: tagVal, next: afterTag } = readVarint(bytes, pos);
    const fieldNumber = Number(tagVal >> 3n);
    const wireType = Number(tagVal & 0x7n);
    pos = afterTag;
    let contentStart,
      contentLen,
      lenVarintLen = 0,
      fieldEnd;

    if (wireType === 0) {
      const { next } = readVarint(bytes, pos);
      contentStart = pos;
      contentLen = next - pos;
      pos = next;
    } else if (wireType === 1) {
      contentStart = pos;
      contentLen = 8;
      pos += 8;
    } else if (wireType === 2) {
      const { value: lenVal, next: afterLen } = readVarint(bytes, pos);
      lenVarintLen = afterLen - pos;
      contentStart = afterLen;
      contentLen = Number(lenVal);
      pos = afterLen + contentLen;
    } else if (wireType === 5) {
      contentStart = pos;
      contentLen = 4;
      pos += 4;
    }
    fieldEnd = pos;
    fields.push({
      fieldNumber,
      wireType,
      tagStart,
      tagLen: afterTag - tagStart,
      lenVarintLen,
      contentStart,
      contentLen,
      fieldEnd,
    });
    pos = fieldEnd;
  }
  return fields;
}

function findField(fields, fieldNumber, wireType) {
  return fields.find(
    (f) => f.fieldNumber === fieldNumber && f.wireType === wireType,
  );
}

function concatBytes(arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function injectAnchorIntoProto(bytes, prefixText) {
  const topFields = walkFields(bytes, 0, bytes.length);
  const contentField = findField(topFields, 2, 2);
  if (!contentField) return null;

  const inner = walkFields(
    bytes,
    contentField.contentStart,
    contentField.contentStart + contentField.contentLen,
  );

  const textField = findField(inner, 3, 2);
  if (!textField) return null;

  const oldText = new TextDecoder("utf-8").decode(
    bytes.subarray(
      textField.contentStart,
      textField.contentStart + textField.contentLen,
    ),
  );
  const newTextBytes = new TextEncoder().encode(prefixText + oldText);
  const newTextLenVarint = writeVarint(newTextBytes.length);
  const tagBytes = bytes.subarray(
    textField.tagStart,
    textField.tagStart + textField.tagLen,
  );

  const field2ContentBefore = bytes.subarray(
    contentField.contentStart,
    textField.tagStart,
  );
  const field2ContentAfter = bytes.subarray(
    textField.contentStart + textField.contentLen,
    contentField.contentStart + contentField.contentLen,
  );

  const newField2Content = concatBytes([
    field2ContentBefore,
    tagBytes,
    newTextLenVarint,
    newTextBytes,
    field2ContentAfter,
  ]);

  const newField2LenVarint = writeVarint(newField2Content.length);
  const field2TagBytes = bytes.subarray(
    contentField.tagStart,
    contentField.tagStart + contentField.tagLen,
  );

  const beforeField2 = bytes.subarray(0, contentField.tagStart);
  const afterField2 = bytes.subarray(
    contentField.contentStart + contentField.contentLen,
  );

  return concatBytes([
    beforeField2,
    field2TagBytes,
    newField2LenVarint,
    newField2Content,
    afterField2,
  ]);
}

window.fetch = async function (...args) {
  try {
    const [resource, init] = args;
    const url = typeof resource === "string" ? resource : resource?.url;

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
      const { lastDate, modes } = await askIsolatedWorld(conversationId);
      const today = todayString();

      let prefix = timeTrack();

      if (lastDate !== today) {
        prefix = `${today} ${timeTrack()}`;
        window.postMessage(
          {
            type: "JARVIS_ANCHOR_SET",
            conversationId: conversationId,
            date: today,
          },
          "*",
        );
      }

      if (modes && modes.length) {
        prefix = prefix + " | mode: " + modes.join(" + ");
      }
      const parsed = JSON.parse(init.body);
      parsed.prompt = "[" + prefix + "]\n" + parsed.prompt;
      init.body = JSON.stringify(parsed);
    }
  } catch (err) {
    console.warn("JARVIS injection failed.\nError: ", err);
  }
  return originalFetch.apply(this, args);
};
