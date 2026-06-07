const buttons = document.querySelectorAll("button");
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    chrome.storage.local.set({ responseMode: btn.dataset.mode });
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("current").textContent = btn.dataset.mode || "none";
  });
});
