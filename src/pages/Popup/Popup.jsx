import React, { useEffect, useState } from 'react';
import './popup.css';

const INITIAL_CONDITIONS = {
  'Domain has a dash (-)': null,
  'Domain uses a .ru, .gift TLD': null,
  'Domain has a token name': null,
  'Suspicious keywords are in the title': null,
  'External JavaScript "seaport.js" is loaded': null,
  'External JavaScript filename is a UUID': null,
};

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
          func: combinedChecks,
        },
        (results) => {
          const checks = results[0].result;
          updatedConditions['External JavaScript "seaport.js" is loaded'] =
            checks.seaportLoaded;
          updatedConditions['External JavaScript filename is a UUID'] =
            checks.uuidFilename;
          updatedConditions['Suspicious keywords are in the title'] =
            checks.titleContainsAirdrop;

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

  const combinedChecks = () => {
    const result = {
      seaportLoaded: false,
      uuidFilename: false,
      titleContainsAirdrop: document.title.toLowerCase().includes('airdrop'),
    };

    const scripts = document.querySelectorAll('script');
    for (let script of scripts) {
      if (script.src) {
        if (script.src.endsWith('seaport.js')) {
          result.seaportLoaded = true;
        }

        const filename = script.src.split('/').pop();
        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(filename.replace('.js', ''))) {
          result.uuidFilename = true;
        }
      }
    }

    return result;
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
