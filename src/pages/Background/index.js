let currentGrade = '?';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      if (activeTabs[0].id === tabId) {
        checkConditions(tab);
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkConditions(tab);
  });
});

function checkConditions(tab) {
  if (!tab.url || !tab.url.startsWith('http')) {
    clearBadge();
    return;
  }

  const domain = new URL(tab.url).hostname;
  let conditionsMet = 0;

  if (domain.includes('-')) conditionsMet++;
  if (['.ru', '.gift'].some((tld) => domain.endsWith(tld))) conditionsMet++;
  if (['usdc', 'usdt', 'eth', 'btc'].some((token) => domain.includes(token)))
    conditionsMet++;

  currentGrade = determineGrade(conditionsMet);
  setBadge(conditionsMet);
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

function setBadge(conditionsCount) {
  const grade = determineGrade(conditionsCount);
  chrome.action.setBadgeText({ text: grade });
  chrome.action.setBadgeBackgroundColor({
    color: determineBadgeColor(conditionsCount),
  });
}

function determineGrade(conditionsCount) {
  const grades = ['A', 'B', 'C', 'D', 'F'];
  return grades[Math.min(conditionsCount, 4)];
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'requestGrade') {
    sendResponse({ grade: currentGrade });
  } else if (message.type === 'requestConditions') {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const domain = new URL(activeTabs[0].url).hostname;
      sendResponse({
        conditions: {
          'Domain has a dash (-)': domain.includes('-'),
          'Domain uses a .ru, .gift TLD': ['.ru', '.gift'].some((tld) =>
            domain.endsWith(tld)
          ),
          'Subdomain has a token name': ['usdc', 'usdt', 'eth', 'btc'].some(
            (token) => domain.includes(token)
          ),
          "The word 'airdrop' is found in the HTML": false,
        },
        grade: currentGrade,
      });
    });
    return true; // Indicates the response is sent asynchronously
  }
});
