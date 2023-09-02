import React, { useEffect, useState } from 'react';
import './popup.css';

const INITIAL_CONDITIONS = {
  'Domain has a dash (-)': null,
  'Domain uses a .ru, .gift TLD': null,
  'Domain has a token name': null,
  "The word 'airdrop' is found in the HTML": null,
};

function Popup() {
  const [conditions, setConditions] = useState(INITIAL_CONDITIONS);
  const [grade, setGrade] = useState(null); // Initialized to null for clarity

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'requestGrade' }, (response) => {
      setGrade(response.grade);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const domain = new URL(tabs[0].url).hostname;
      const updatedConditions = getUpdatedConditions(domain);

      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: contentCheck,
        },
        (results) => {
          updatedConditions["The word 'airdrop' is found in the HTML"] =
            results[0].result;
          const determinedGrade = determineGrade(updatedConditions);
          setConditions(updatedConditions);
          setGrade(determinedGrade);
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

  const contentCheck = () =>
    document.body.innerHTML.toLowerCase().includes('airdrop');

  const determineGrade = (updatedConditions) => {
    const negativeConditionsCount =
      Object.values(updatedConditions).filter(Boolean).length;
    const grades = ['A', 'B', 'C', 'D', 'F'];
    return grades[Math.min(negativeConditionsCount, 4)];
  };

  return (
    <div className="App">
      {/* Conditionally render the grade */}
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
