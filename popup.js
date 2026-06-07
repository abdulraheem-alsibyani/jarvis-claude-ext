const buttons = document.querySelectorAll("button");
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    chrome.storage.local.set({ responseMode: btn.dataset.mode });
  });
});
