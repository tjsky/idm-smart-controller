const DEFAULT_IDM_ID = "ngpampappnmepgilojfohadhhmbhlaek";

// 获取当前扩展 ID 列表
async function getTargetIds() {
  const { targetExtensionIds = [DEFAULT_IDM_ID] } = await chrome.storage.sync.get("targetExtensionIds");
  return targetExtensionIds;
}

function createIconImageData(isEnabled) {
  const canvas = new OffscreenCanvas(32, 32);
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 32, 32);

  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  ctx.roundRect(2, 2, 28, 28, 6);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(16, 22);
  ctx.lineTo(9, 14);
  ctx.lineTo(13, 14);
  ctx.lineTo(13, 7);
  ctx.lineTo(19, 7);
  ctx.lineTo(19, 14);
  ctx.lineTo(23, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(9, 24, 14, 2);

  if (!isEnabled) {
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(16, 16, 13.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(6.5, 6.5);
    ctx.lineTo(25.5, 25.5);
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, 32, 32);
}

function updateVisualState(isEnabled, matchedReason = "") {
  const imageData = createIconImageData(isEnabled);
  chrome.action.setIcon({ imageData: { 32: imageData } });
  chrome.action.setBadgeText({ text: "" });

  if (isEnabled) {
    chrome.action.setTitle({ title: "受管扩展状态: 已启用" });
  } else {
    const reasonText = matchedReason ? `\n命中规则标签: ${matchedReason}` : "\n(手动快捷键/点击禁用)";
    chrome.action.setTitle({ title: `受管扩展状态: 已禁用${reasonText}` });
  }
}

async function checkOverallStatus() {
  const targetIds = await getTargetIds();
  if (targetIds.length === 0) return true;

  return new Promise((resolve) => {
    let checked = 0;
    let anyDisabled = false;

    targetIds.forEach(id => {
      chrome.management.get(id, (info) => {
        checked++;
        if (!chrome.runtime.lastError && info && !info.enabled) {
          anyDisabled = true;
        }
        if (checked === targetIds.length) {
          resolve(!anyDisabled);
        }
      });
    });
  });
}

async function setManagedExtensionsEnabled(enabled) {
  const targetIds = await getTargetIds();
  for (const id of targetIds) {
    chrome.management.get(id, (info) => {
      if (chrome.runtime.lastError || !info) return;
      if (info.enabled !== enabled) {
        chrome.management.setEnabled(id, enabled);
      }
    });
  }
}

async function evaluateAllTabs() {
  const { blockedRules = [] } = await chrome.storage.sync.get("blockedRules");
  const tabs = await chrome.tabs.query({});

  let matchedUrl = "";
  const hasMatchedTab = tabs.some(tab => {
    if (!tab.url) return false;
    const match = blockedRules.find(rule => rule.trim() && tab.url.includes(rule.trim()));
    if (match) {
      matchedUrl = tab.url;
      return true;
    }
    return false;
  });

  if (hasMatchedTab) {
    await setManagedExtensionsEnabled(false);
    updateVisualState(false, matchedUrl);
  } else {
    await setManagedExtensionsEnabled(true);
    updateVisualState(true);
  }
}

async function toggleAllExtensions() {
  const isCurrentlyEnabled = await checkOverallStatus();
  const targetState = !isCurrentlyEnabled;
  await setManagedExtensionsEnabled(targetState);
  updateVisualState(targetState);
}

chrome.management.onEnabled.addListener(async () => {
  const status = await checkOverallStatus();
  updateVisualState(status);
});
chrome.management.onDisabled.addListener(async () => {
  const status = await checkOverallStatus();
  updateVisualState(status);
});

chrome.tabs.onCreated.addListener(() => evaluateAllTabs());
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) evaluateAllTabs();
});
chrome.tabs.onRemoved.addListener(() => evaluateAllTabs());
chrome.tabs.onReplaced.addListener(() => evaluateAllTabs());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.blockedRules || changes.targetExtensionIds)) {
    evaluateAllTabs();
  }
});

chrome.action.onClicked.addListener(() => toggleAllExtensions());
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-idm") toggleAllExtensions();
});

chrome.runtime.onStartup.addListener(() => evaluateAllTabs());
chrome.runtime.onInstalled.addListener(() => evaluateAllTabs());