import React, { useEffect, useState } from 'react';
import './popup.css';

const INITIAL_CONDITIONS = {
  'Domain has a dash (-)': null,
  'Domain uses a .ru, .gift TLD': null,
  'Domain has a token name': null,
  'Suspicious keywords are in the title': null,
  'External JavaScript "seaport.js" is loaded': null,
};

const KEYWORDS = ['airdrop', 'sitepoint'];

function Popup() {
  const [conditions, setConditions] = useState(INITIAL_CONDITIONS);
  const [grade, setGrade] = useState(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const domain = new URL(tabs[0].url).hostname;
      const updatedConditions = getUpdatedConditions(domain);

      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: seaportJsCheck,
        },
        (results) => {
          updatedConditions['External JavaScript "seaport.js" is loaded'] =
            results[0].result;

          // Continue with the check for keywords in the title
          chrome.scripting.executeScript(
            {
              target: { tabId: tabs[0].id },
              func: titleCheck,
            },
            (keywordResults) => {
              updatedConditions['Suspicious keywords are in the title'] =
                keywordResults[0].result;

              const determinedGrade = determineGrade(updatedConditions);
              setConditions(updatedConditions);
              setGrade(determinedGrade);

              // Inform background to update badge
              chrome.runtime.sendMessage({
                type: 'updateBadge',
                grade: determinedGrade,
              });
            }
          );
        }
      );
    });
  }, []);

  const getUpdatedConditions = (domain) => ({
    ...conditions,
    'Domain has a dash (-)': domain.includes('-'),
    'Domain uses a .ru, .gift TLD': ['.ru', '.gift'].some((tld) =>
      domain.endsWith(tld)
    ),
    'Domain has a token name': ['usdc', 'usdt', 'eth', 'apecoin'].some(
      (token) => domain.includes(token)
    ),
  });

  const titleCheck = () => document.title.toLowerCase().includes('airdrop');

  const seaportJsCheck = () => {
    const scripts = document.querySelectorAll('script');
    for (let script of scripts) {
      if (script.src && script.src.endsWith('seaport.js')) {
        return true;
      }
    }
    return false;
  };

  const determineGrade = (updatedConditions) => {
    const negativeConditionsCount =
      Object.values(updatedConditions).filter(Boolean).length;
    const grades = ['A', 'B', 'C', 'D', 'F'];
    return grades[Math.min(negativeConditionsCount, 4)];
  };

  return (
    <div className="App">
      {grade ? <h1>Grade: {grade}</h1> : <h1>Grade: Not Determined</h1>}
      <p>Final grade based on:</p>
      <ul>
        {Object.entries(conditions).map(([condition, value], index) => (
          <li key={index}>
            {condition}: {value === null ? '⏳' : value ? '✅' : '🚫'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Popup;
