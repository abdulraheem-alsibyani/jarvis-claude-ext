# Jarvis — Claude Context Injector

Jarvis lets Claude know the date and time so that it actually understands what part of your day you're on as you're conversing.
Jarvis also lets you customize response types.

## What it does

The problem: LLMs providers have no clue about current time or any temporal sense that is practically useful
What Jarvis injects:

1. The current time in the local timezone with every message sent to Claude
2. The local date once a day per conversation so that every conversation gets the date context and every conversation updates on a new day
3. Response mode injections

## How it works

[This is the section that signals engineering. Explain the architecture
in your own words:

- window.fetch, identify the completion POST by its URL, parse the request body's JSON, prepend the injection to the prompt field, re-serialize, and forward. It's all wrapped so that any failure falls back to sending the original message untouched.
- Content scripts run in an _isolated world_ (has `chrome.*`, no access to the page's fetch). Patching `window.fetch` only works in the main world (the page's context).
- The content script (isolated world) injects the patcher by creating a `<script>` element whose `src` is `chrome.runtime.getURL("injection.js")` and appending it to the page's DOM. Because the _page_ loads it, `injection.js` runs in the main world. This requires declaring `injection.js` under `web_accessible_resources` in the manifest — otherwise the page is not permitted to load the extension file.
- The main-world patcher can't reach `chrome.storage`, so it asks the isolated-world content script over `window.postMessage`. Each query carries a `type` (to separate it from the page's own messages) and a unique `crypto.randomUUID()` id. The content script reads storage and posts a reply echoing that id; the main world matches on the id to pair.
- All modification happens inside a `try`/`catch`. If anything throws — a malformed body, an unexpected request shape — the original request is sent unmodified rather than broken. The injection is best-effort: it never blocks the user from sending a message, so an internal failure degrades silently instead of breaking claude.ai.

## Installation

1. Clone the repo
2. Go to chrome://extensions on your Chrome browsers
3. Click "Load unpacked" and select the cloned repo

## Response modes

Currently there are 3 response mode categories (7 modes in total)

1. Shorteners make Claude's reponses shorter (1 line, 1 paragraph, brief)
2. Lengtheners make Claude's responses longer and more thoughtful (Go deep, Search the web -which makes Claude use the Web Search tool.)
3. Structurers make Claude respond in a certain format (table, numbered bullets)

Shorteners can combine with Structurers but cannot be combined amongst themselves.
Lengtheners can compound and be combined with Structurers.
Only 1 Structurer can be chosen at a time.
These modes are NOT on by default but will STAY on for all conversations not just the current one (will add per-conversation functionality in a future update) until the None mode is selected.

## Privacy

Jarvis does not collect, store, transmit, or sell any user data. The extension reads and modifies the body of your outgoing claude.ai messages locally in your browser to prepend a timestamp and optional formatting preferences. Your response-mode preferences and per-conversation timestamp dates are stored locally via chrome.storage.local and never leave your device. No data is sent to any server, the developer, or any third party. The extension operates only on claude.ai.
Contact: ar.alsibyani@gmail.com

## Tech

Stack: Manifest V3 API, vanilla JS, HTML, CSS, chrome.storage API
