export function addLog(message, type = "info") {
  const panel = document.getElementById("logPanel");
  const div = document.createElement("div");
  div.className = `log-${type}`;
  div.textContent = message;
  panel.prepend(div);
}
