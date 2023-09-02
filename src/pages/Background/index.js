let currentGrade = '?';

chrome.tabs.onActivated.addListener((activeInfo) => {
  // Clear the badge when switching tabs
  clearBadge(activeInfo.tabId);
});

// Clear the badge when navigating to a new URL or reloading a tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    clearBadge(tabId);
  }
});

function clearBadge(tabId) {
  chrome.action.setBadgeText({ text: '', tabId });
}

function setBadge(grade, tabId) {
  chrome.action.setBadgeText({ text: grade, tabId });
  const conditionsCount = gradeToConditionsCount(grade);
  chrome.action.setBadgeBackgroundColor({
    color: determineBadgeColor(conditionsCount),
    tabId,
  });
}

function determineBadgeColor(conditionsCount) {
  const colors = [
    '#00FF00',
    '#ADFF2F',
    '#FFFF00',
    '#FFA500',
    '#FF0000',
    '#888888',
  ];
  return colors[Math.min(conditionsCount, 5)];
}

function gradeToConditionsCount(grade) {
  const grades = ['A', 'B', 'C', 'D', 'F'];
  return grades.indexOf(grade);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateBadge') {
    const grade = message.grade;
    currentGrade = grade;
    setBadge(grade, sender.tab.id);
  } else if (message.type === 'requestGrade') {
    sendResponse({ grade: currentGrade });
  }
});
