document.addEventListener('DOMContentLoaded', function() {
  const actionSelect = document.getElementById('actionSelect');
  const urlSection = document.getElementById('urlSection');
  const textSection = document.getElementById('textSection');
  const sourcesSection = document.getElementById('sourcesSection');
  const resultDiv = document.getElementById('result');
  const urlInput = document.getElementById('urlInput');
  const sourceUrlInput = document.getElementById('sourceUrl');
  const serverDropdown = document.getElementById('serverSelect');

  // Load servers from storage
  browser.storage.sync.get(['servers', 'defaultServer']).then(function(data) {
    const servers = data.servers || ['http://127.0.0.1:7777'];
    const defaultServer = data.defaultServer || 'http://127.0.0.1:7777';
    serverDropdown.innerHTML = ''; // Clear existing options
    servers.forEach(server => {
      const option = document.createElement('option');
      option.value = server;
      option.textContent = server;
      if (server === defaultServer) {
        option.selected = true;
      }
      serverDropdown.appendChild(option);
    });
  });

  // Fetch current tab URL and prefill the inputs
  browser.tabs.query({active: true, currentWindow: true}).then(function(tabs) {
    if (tabs[0] && tabs[0].url) {
      urlInput.value = tabs[0].url;
      // Prefill the source URL with the root of the current website
      const url = new URL(tabs[0].url);
      sourceUrlInput.value = `${url.protocol}//${url.hostname}`;
    }
  });

  actionSelect.addEventListener('change', function() {
    urlSection.classList.add('hidden');
    textSection.classList.add('hidden');
    sourcesSection.classList.add('hidden');

    switch(this.value) {
      case 'url':
        urlSection.classList.remove('hidden');
        break;
      case 'text':
        textSection.classList.remove('hidden');
        break;
      case 'sources':
        sourcesSection.classList.remove('hidden');
        break;
    }
    adjustPopupHeight();
  });

  function adjustPopupHeight() {
    document.body.style.height = 'auto';
  }

  document.getElementById('addUrlButton').addEventListener('click', function() {
    const url = urlInput.value;
    const type = document.getElementById('urlTypeSelect').value;
    const ttsEngine = document.getElementById('urlTtsEngine').value;
    const serverUrl = serverDropdown.value;
    if (url) {
      browser.runtime.sendMessage({
        action: `addUrl${type.charAt(0).toUpperCase() + type.slice(1)}`,
        url: url,
        ttsEngine: ttsEngine,
        serverUrl: serverUrl
      }).then(function(response) {
        resultDiv.textContent = response.message;
      }).catch(function(error) {
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('Error:', error);
      });
    } else {
      resultDiv.textContent = 'Please enter a URL';
    }
    adjustPopupHeight();
  });
  document.getElementById('addTextButton').addEventListener('click', function() {
    const text = document.getElementById('textInput').value;
    const type = document.getElementById('textTypeSelect').value;
    const ttsEngine = document.getElementById('textTtsEngine').value;
    const serverUrl = serverDropdown.value;
    if (text) {
      browser.runtime.sendMessage({
        action: `addText${type.charAt(0).toUpperCase() + type.slice(1)}`,
        text: text,
        ttsEngine: ttsEngine,
        serverUrl: serverUrl
      }).then(function(response) {
        resultDiv.textContent = response.message;
      }).catch(function(error) {
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('Error:', error);
      });
    } else {
      resultDiv.textContent = 'Please enter some text';
    }
    adjustPopupHeight();
  });

  document.getElementById('addSourceButton').addEventListener('click', function() {
    const url = sourceUrlInput.value;
    const keywords = document.getElementById('sourceKeywords').value.split(',').map(k => k.trim());
    const serverUrl = serverDropdown.value;
    if (url && keywords.length > 0) {
      browser.runtime.sendMessage({
        action: 'addSource',
        sourceData: { url, keywords },
        serverUrl: serverUrl
      }).then(function(response) {
        resultDiv.textContent = response.message;
      }).catch(function(error) {
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('Error:', error);
      });
    } else {
      resultDiv.textContent = 'Please enter a URL and at least one keyword';
    }
    adjustPopupHeight();
  });

  document.getElementById('fetchSourcesButton').addEventListener('click', function() {
    const serverUrl = serverDropdown.value;
    browser.runtime.sendMessage({action: 'fetchSources', serverUrl: serverUrl}).then(function(response) {
      resultDiv.textContent = response.message;
    });
    adjustPopupHeight();
  });

  document.getElementById('getSourcesButton').addEventListener('click', function() {
    const serverUrl = serverDropdown.value;
    browser.runtime.sendMessage({action: 'getSources', serverUrl: serverUrl}).then(function(response) {
      try {
        const data = JSON.parse(response.message);
        let displayText = "Global Keywords: " + (data.global_keywords ? data.global_keywords.join(", ") : "None") + "\n\nSources:\n";
        if (data.sources && data.sources.length > 0) {
          data.sources.forEach(source => {
            displayText += `URL: ${source.url}\nKeywords: ${source.keywords.join(", ")}\n\n`;
          });
        } else {
          displayText += "No sources found.";
        }
        resultDiv.textContent = displayText;
      } catch (error) {
        resultDiv.textContent = "Error parsing sources: " + response.message;
      }
      adjustPopupHeight();
    });
  });
});