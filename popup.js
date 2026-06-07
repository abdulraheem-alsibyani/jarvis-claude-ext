const MODE_GROUPS = {
  "1 line": "short",
  "1 paragraph": "short",
  brief: "short",
  "go deep": "long",
  "search the web": "long",
  table: "structure",
  "numbered bullets": "structure",
};
const GROUP_RULES = {
  short: { exclusive: true },
  long: { exclusive: false },
  structure: { exclusive: true },
};
let activeModes = [];

chrome.storage.local.get("responseModes", (result) => {
  const buttons = document.querySelectorAll("button");
  activeModes = result.responseModes || [];

  function renderActive(activeArray) {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", activeArray.includes(btn.dataset.mode));
    });
  }

  function persist() {
    chrome.storage.local.set({ responseModes: activeModes });
    renderActive(activeModes);
    document.getElementById("current").textContent = activeModes.length
      ? activeModes.join(", ")
      : "none";
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const clicked = btn.dataset.mode;
      const group = MODE_GROUPS[clicked];
      let active = [...activeModes];

      if (active.includes(clicked)) {
        active = active.filter((m) => m !== clicked);
      } else {
        if (GROUP_RULES[group].exclusive) {
          active = active.filter((m) => MODE_GROUPS[m] !== group);
        }
        if (group === "short")
          active = active.filter((m) => MODE_GROUPS[m] !== "long");
        if (group === "long")
          active = active.filter((m) => MODE_GROUPS[m] !== "short");
        active.push(clicked);
      }

      activeModes = active;
      persist();
    });
  });

  renderActive(activeModes);
  document.getElementById("current").textContent = activeModes.length
    ? activeModes.join(", ")
    : "none";
});
