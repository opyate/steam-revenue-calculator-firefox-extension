// Remove beta=1 cookie that causes Steam API to reject Firefox requests
browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const cookie = details.requestHeaders.find((h) => h.name.toLowerCase() === 'cookie');
    if (cookie) {
      cookie.value = cookie.value.replace(/;\s*beta=1\b|\bbeta=1;\s*|\bbeta=1\b/g, '');
    }
    return { requestHeaders: details.requestHeaders };
  },
  { urls: ['https://store.steampowered.com/api/appdetails*'] },
  ['blocking', 'requestHeaders']
);
