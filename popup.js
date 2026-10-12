document.addEventListener('DOMContentLoaded', () => {
  const autoFillBtn = document.getElementById('autoFillBtn');
  const jsonInput = document.getElementById('jsonInput');
  const statusMsg = document.getElementById('status');

  autoFillBtn.addEventListener('click', async () => {
    const rawData = jsonInput.value.trim();
    if (!rawData) {
      showStatus('Please paste JSON data first.', 'error');
      return;
    }

    try {
      const jsonData = JSON.parse(rawData);
      
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showStatus('No active tab found.', 'error');
        return;
      }

      showStatus('Filling form...', 'success');
      
      // Send data to content script
      chrome.tabs.sendMessage(tab.id, { action: 'AUTO_FILL', data: jsonData }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Error: Make sure you are on a form page and refresh.', 'error');
          console.error(chrome.runtime.lastError);
        } else if (response && response.success) {
          showStatus(`Successfully filled ${response.count} fields!`, 'success');
        } else {
          showStatus('Failed to fill fields or no fields found.', 'error');
        }
      });

    } catch (e) {
      showStatus('Invalid JSON format. Please check your data.', 'error');
      console.error(e);
    }
  });

  function showStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = `status-msg ${type}`;
    setTimeout(() => {
      if (statusMsg.textContent === msg) {
        statusMsg.textContent = '';
      }
    }, 4000);
  }
});
