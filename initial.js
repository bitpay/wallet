chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'bounds': {
      'width': 1280,
      'height': 800
    }
  });
});
