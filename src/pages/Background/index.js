chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    console.log('Tab is loading...');
    chrome.action.setBadgeText({ text: '?' });
    chrome.action.setBadgeBackgroundColor({ color: '#888888' });
  } else if (changeInfo.status === 'complete') {
    console.log('Tab finished loading. Checking conditions...');
    if (changeInfo.url) {
      tab.url = changeInfo.url; // Update the URL if it's provided in changeInfo
    }
    checkConditions(tab, setBadge);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Switched tabs...');
  chrome.action.setBadgeText({ text: '?' });
  chrome.action.setBadgeBackgroundColor({ color: '#888888' });

  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkConditions(tab, setBadge);
  });
});

function checkConditions(tab, callback) {
  chrome.tabs.get(tab.id, function (updatedTab) {
    console.log('Inside checkConditions for URL:', updatedTab.url);

    if (
      !updatedTab.url ||
      !(
        updatedTab.url.startsWith('http://') ||
        updatedTab.url.startsWith('https://')
      )
    ) {
      console.log(
        'Exiting checkConditions due to non-http/https URL:',
        updatedTab.url
      );
      return;
    }

    const domain = new URL(updatedTab.url).hostname;
    let conditionsMet = 0;

    if (domain.includes('-')) {
      conditionsMet++;
    }

    if (domain.endsWith('.ru')) {
      conditionsMet++;
    }

    const tokens = ['usdc', 'usdt', 'eth', 'btc'];

    if (tokens.some((token) => domain.includes(token))) {
      conditionsMet++;
    }

    const tlds = ['ru', 'gift'];

    if (tlds.some((tld) => domain.includes(tld))) {
      conditionsMet++;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: updatedTab.id },
        func: contentCheck,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error('Error in executeScript:', chrome.runtime.lastError);
          return;
        }

        if (!results) {
          console.error(
            'No results from executeScript. Possibly blocked by Content Security Policy or another error.'
          );
          return;
        }

        console.log('Results from executeScript:', results);

        if (results && results[0].result) {
          conditionsMet++;
        }
        callback(conditionsMet);
      }
    );
  });
}

function contentCheck() {
  return document.body.innerHTML.toLowerCase().includes('airdrop');
}

function setBadge(conditionsMet) {
  let grade;
  switch (conditionsMet) {
    case 0:
      return 'A';
    case 1:
      return 'B';
    case 2:
      return 'C';
    case 3:
      return 'D';
    case 4:
      return 'F';
    default:
      grade = 'N/A';
      break;
  }

  console.log('Setting badge to:', grade);
  chrome.action.setBadgeText({ text: grade });
  chrome.action.setBadgeBackgroundColor({
    color: determineBadgeColor(conditionsMet),
  });
}

function determineBadgeColor(conditionsMet) {
  switch (conditionsMet) {
    case 0:
      return '#00FF00'; // Green
    case 1:
      return '#ADFF2F'; // Yellowish Green
    case 2:
      return '#FFFF00'; // Yellow
    case 3:
      return '#FFA500'; // Orange
    case 4:
      return '#FF0000'; // Red
    default:
      return '#888888'; // Grey
  }
}
