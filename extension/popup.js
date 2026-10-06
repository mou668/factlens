const checkButton = document.querySelector('#check');
const statusText = document.querySelector('#status');
const result = document.querySelector('#result');

checkButton.addEventListener('click', async () => {
  checkButton.disabled = true;
  statusText.classList.remove('error');
  statusText.classList.add('is-loading');
  checkButton.setAttribute('aria-busy', 'true');
  statusText.textContent = 'Reading the active page...';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const extracted = await chrome.tabs.sendMessage(tab.id, { type: 'extractArticle' });
    if (!extracted?.text) throw new Error('No readable article text found on this page.');
    statusText.textContent = 'Checking signals...';
    const response = await fetch('http://127.0.0.1:8000/v1/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: extracted.text, source_url: extracted.url, language: 'en' })
    });
    if (!response.ok) throw new Error('FactLens could not complete this check. Try again shortly.');
    const data = await response.json();
    const state = data.type || 'review';
    result.hidden = false;
    result.className = state;
    document.querySelector('#verdict').textContent = data.verdict;
    document.querySelector('#category').textContent = data.category;
    document.querySelector('#confidence').textContent = `${data.confidence}%`;
    document.querySelector('#rationale').textContent = data.rationale;
    statusText.textContent = 'FactLens review complete.';
  } catch (error) {
    statusText.classList.add('error');
    statusText.textContent = error.message.includes('Could not establish connection')
      ? 'This page cannot be read. Open a public article and try again.'
      : error.message.includes('Failed to fetch')
        ? 'FactLens is unavailable right now. Try again shortly.'
        : error.message;
  } finally {
    statusText.classList.remove('is-loading');
    checkButton.removeAttribute('aria-busy');
    checkButton.disabled = false;
  }
});
