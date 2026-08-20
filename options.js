const DEFAULT_IDM_ID = "ngpampappnmepgilojfohadhhmbhlaek";

document.addEventListener("DOMContentLoaded", async () => {
  const extContainer = document.getElementById("ext-container");
  const rulesTextarea = document.getElementById("rules");
  const saveBtn = document.getElementById("save");
  const status = document.getElementById("status");

  const {
    targetExtensionIds = [DEFAULT_IDM_ID],
    blockedRules = ["pixiv.net", "x.com", "twitter.com"]
  } = await chrome.storage.sync.get(["targetExtensionIds", "blockedRules"]);

  rulesTextarea.value = blockedRules.join("\n");

  chrome.management.getAll((allExts) => {
    extContainer.innerHTML = "";
    const currentExtId = chrome.runtime.id;

    const validExts = allExts.filter(ext => ext.id !== currentExtId && ext.type !== "theme");

    if (validExts.length === 0) {
      extContainer.innerHTML = `<div style="padding: 10px; color: #94a3b8; text-align: center;">未检测到其他已安装扩展</div>`;
      return;
    }

    validExts.forEach(ext => {
      const item = document.createElement("label");
      item.className = "ext-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = ext.id;
      checkbox.checked = targetExtensionIds.includes(ext.id);

      const icon = document.createElement("img");
      icon.className = "ext-icon";
      const bestIcon = ext.icons && ext.icons.length > 0 ? ext.icons[ext.icons.length - 1].url : "";
      icon.src = bestIcon || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5z'/%3E%3C/svg%3E";

      const nameSpan = document.createElement("span");
      nameSpan.className = "ext-name";
      nameSpan.textContent = ext.name;

      const idSpan = document.createElement("span");
      idSpan.className = "ext-id";
      idSpan.textContent = `(${ext.id.slice(0, 6)}...)`;

      item.appendChild(checkbox);
      item.appendChild(icon);
      item.appendChild(nameSpan);
      item.appendChild(idSpan);
      extContainer.appendChild(item);
    });
  });

  saveBtn.addEventListener("click", () => {
    const checkedBoxes = extContainer.querySelectorAll('input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);

    const rules = rulesTextarea.value
      .split("\n")
      .map(r => r.trim())
      .filter(r => r.length > 0);

    chrome.storage.sync.set({
      targetExtensionIds: selectedIds,
      blockedRules: rules
    }, () => {
      status.textContent = "✓ 设置已保存并已立即生效";
      setTimeout(() => { status.textContent = ""; }, 2500);
    });
  });
});