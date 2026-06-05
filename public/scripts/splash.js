(function() {
  var splash = document.getElementById('static-splash');
  var appReady = false;
  var windowLoaded = false;
  function fadeOut() {
    if (splash && !splash.classList.contains('fade-out')) {
      splash.classList.add('fade-out');
      setTimeout(function() { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 700);
    }
  }
  function tryFade() {
    if (appReady && windowLoaded) fadeOut();
  }
  window.addEventListener('swipess-ready', function() { appReady = true; tryFade(); });
  window.addEventListener('app-rendered', function() { appReady = true; tryFade(); });
  window.addEventListener('load', function() {
    windowLoaded = true;
    setTimeout(tryFade, 250);
  });
  setTimeout(function() {
    if (appReady) { fadeOut(); return; }
    if (splash) {
      splash.innerHTML =
        '<div style="text-align:center;padding:48px 24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">' +
        '<div style="width:48px;height:48px;border:3px solid rgba(255,255,255,0.1);border-top-color:rgba(255,255,255,0.75);border-radius:50%;animation:spin 0.9s linear infinite;margin:0 auto 24px"></div>' +
        '<p style="color:rgba(255,255,255,0.45);font-size:13px;margin:0 0 24px;line-height:1.6">Something went wrong.<br>Tap below to recover.</p>' +
        '<button id="swipess-recovery-btn" ' +
        'style="background:rgba(255,255,255,0.95);color:#000;border:none;padding:13px 28px;border-radius:999px;font-weight:800;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer">' +
        'Refresh App</button>' +
        '</div>';
      var btn = document.getElementById('swipess-recovery-btn');
      if (btn) {
        btn.addEventListener('click', function() {
          window.location.href = '/?reset=1&t=' + Date.now();
        });
      }
    }
  }, 6000);
})();
