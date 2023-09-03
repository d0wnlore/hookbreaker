import React, { useEffect, useState } from 'react';
import './popup.css';

const INITIAL_CONDITIONS = {
  'Domain has a dash (-)': null,
  'Domain uses a suspicious TLD': null,
  'Domain has suspicious keywords': null,
  'Suspicious keywords in title or content': null,
  'Loads a known NFT drainer script': null,
  'Loads JavaScript with suspicious filenames': null,
  'Loads disable-devtool script': null,
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
          updatedConditions['Loads a known NFT drainer script'] =
            checks.seaportLoaded;
          updatedConditions['Loads JavaScript with suspicious filenames'] =
            checks.uuidFilename;
          updatedConditions['Suspicious keywords in title or content'] =
            checks.titleContainsAirdrop;
          updatedConditions['Loads disable-devtool script'] =
            checks.disableDevtoolLoaded;

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

  const determineGradeColor = (grade) => {
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const colors = [
      '#00FF00',
      '#ADFF2F',
      '#FFFF00',
      '#FFA500',
      '#FF0000',
      '#888888',
    ];
    const index = grades.indexOf(grade);
    return colors[Math.min(index, 5)];
  };

  const getUpdatedConditions = (domain) => ({
    ...conditions,
    'Domain has a dash (-)': domain.includes('-'),
    'Domain uses a suspicious TLD': ['.ru', '.gift'].some((tld) =>
      domain.endsWith(tld)
    ),
    'Domain has suspicious keywords': [
      'usdc',
      'usdt',
      'apecoin',
      'whitelist',
    ].some((token) => domain.includes(token)),
  });

  const combinedChecks = () => {
    const result = {
      seaportLoaded: false,
      uuidFilename: false,
      disableDevtoolLoaded: false,
      titleContainsAirdrop:
        document.title.toLowerCase().includes('airdrop') ||
        document.body.textContent.toLowerCase().includes('airdrop'),
    };

    const scripts = document.querySelectorAll('script');
    for (let script of scripts) {
      if (script.src) {
        if (script.src.endsWith('seaport.js')) {
          result.seaportLoaded = true;
        }

        if (script.src.endsWith('disable-devtool')) {
          result.disableDevtoolLoaded = true;
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

  const isPhishingGrade = (grade) => {
    const phishingGrades = ['C', 'D', 'F'];
    return phishingGrades.includes(grade);
  };

  return (
    <div className="App">
      {grade ? (
        <>
          <h1 style={{ color: determineGradeColor(grade) }}>Grade: {grade}</h1>
          {isPhishingGrade(grade) && (
            <h2 style={{ color: 'red' }}>🎣 Phishing</h2>
          )}
        </>
      ) : (
        <h1>Grade: Not Determined</h1>
      )}
      <p>Final grade based on:</p>
      <ul>
        {Object.entries(conditions).map(([condition, value], index) => (
          <li key={index}>
            {condition}: {value === null ? '❓' : value ? '✅' : '🚫'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Popup;
