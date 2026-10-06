chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "extractArticle") return;
  const selection = window.getSelection()?.toString().trim();
  const mainText = document.querySelector("article")?.innerText || document.body.innerText;
  sendResponse({ text: (selection || mainText).replace(/\s+/g, " ").trim().slice(0, 12000), url: window.location.href });
});
