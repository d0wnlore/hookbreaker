let currentGrade = '?';

chrome.tabs.onActivated.addListener((activeInfo) => {
  // Clear the badge when switching tabs
  clearBadge();
});

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

function setBadge(grade) {
  chrome.action.setBadgeText({ text: grade });
  const conditionsCount = gradeToConditionsCount(grade);
  chrome.action.setBadgeBackgroundColor({
    color: determineBadgeColor(conditionsCount),
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
    setBadge(grade);
  } else if (message.type === 'requestGrade') {
    sendResponse({ grade: currentGrade });
  }
});
