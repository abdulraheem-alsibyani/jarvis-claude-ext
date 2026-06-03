const injectee = document.createElement("script");
injectee.src = chrome.runtime.getURL("injection.js");
document.documentElement.appendChild(injectee);
injectee.remove();
