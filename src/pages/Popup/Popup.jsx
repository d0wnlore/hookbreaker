import React, { useEffect, useState } from 'react';
import './popup.css';

function Popup() {
  const [conditions, setConditions] = useState({
    'Domain has a dash (-)': null,
    'Domain uses a .ru, .gift TLD': null,
    'Subdomain has a token name': null,
    "The word 'airdrop' is found in the HTML": null,
  });
  const [grade, setGrade] = useState('?');

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const domain = new URL(tabs[0].url).hostname;

      // Check for dash in domain
      conditions['Domain has a dash (-)'] = !domain.includes('-');

      // Check for .ru TLD
      const tlds = ['ru', 'gift'];
      conditions['Domain uses a .ru, .gift TLD'] = !tlds.some((tld) =>
        domain.includes(tld)
      );

      // Check for token name in subdomain
      const tokens = ['usdc', 'usdt', 'eth', 'btc'];
      conditions['Subdomain has a token name'] = !tokens.some((token) =>
        domain.includes(token)
      );

      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: contentCheck,
        },
        (results) => {
          conditions["The word 'airdrop' is found in the HTML"] =
            !results[0].result;

          // Calculate grade based on conditions
          const negativeConditions = Object.values(conditions).filter(
            (val) => val === false
          ).length;
          const calculatedGrade = determineGrade(negativeConditions);
          setGrade(calculatedGrade);

          // Update badge with the new grade
          chrome.action.setBadgeText({ text: calculatedGrade });
          chrome.action.setBadgeBackgroundColor({
            color: determineBadgeColor(negativeConditions),
          });

          // Update state with new conditions
          setConditions({ ...conditions });
        }
      );
    });
  }, []);

  function contentCheck() {
    return document.body.innerHTML.toLowerCase().includes('airdrop');
  }

  function determineGrade(negativeConditions) {
    switch (negativeConditions) {
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
        return '???';
    }
  }

  function determineBadgeColor(negativeConditions) {
    switch (negativeConditions) {
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

  return (
    <div className="App">
      <h1>Grade: {grade}</h1>
      <p>Final grade based on:</p>
      <ul>
        {Object.keys(conditions).map((condition, index) => (
          <li key={index}>
            {condition}:{' '}
            {conditions[condition] === null
              ? '⏳'
              : conditions[condition]
              ? '✅'
              : '🚫'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Popup;
