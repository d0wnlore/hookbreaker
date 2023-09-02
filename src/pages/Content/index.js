// This code will run on every page due to "<all_urls>" match pattern
document.addEventListener('DOMContentLoaded', function () {
  // Code to check the presence of 'debugger' in scripts
  const scriptTags = document.querySelectorAll('script[src]');
  for (let script of scriptTags) {
    fetch(script.src)
      .then((response) => response.text())
      .then((content) => {
        if (content.includes('debugger')) {
          // Send a message to background.js or popup.js
          chrome.runtime.sendMessage({
            type: 'debuggerDetected',
            url: script.src,
          });
        }
      })
      .catch((error) => {
        console.error('Error fetching script:', error);
      });
  }
});
