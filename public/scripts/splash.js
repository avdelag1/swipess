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
  setTimeout(fadeOut, 6000);
})();
