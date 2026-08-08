(function() {
  // Canonical live web/PWA host. swipess.app currently has broken DNS /
  // Vercel DEPLOYMENT_NOT_FOUND — phones that bookmarked it get a blank fail.
  try {
    var h = location.hostname || '';
    if (h === 'swipess.app' || h === 'www.swipess.app') {
      location.replace('https://www.swipess.com' + location.pathname + location.search + location.hash);
      return;
    }
  } catch (e) {}

  try {
    var lastRole = localStorage.getItem('swipess_user_role') || 'client';
    window.__PREDICTED_ROLE = lastRole;
  } catch(e) {}
  var theme = 'dark';
  var root = document.documentElement;
  root.classList.add(theme, 'black-matte');
  root.style.backgroundColor = '#000000';
  root.style.colorScheme = 'dark';
  (window.requestIdleCallback || setTimeout)(function() {
    var orig = window.EventTarget.prototype.addEventListener;
    window.EventTarget.prototype.addEventListener = function(type, listener, options) {
      var op = options;
      if (type === 'touchstart' || type === 'touchmove') {
        if (typeof options === 'boolean') op = { capture: options, passive: true };
        else if (typeof options === 'object') op = Object.assign({}, options, { passive: true });
        else op = { passive: true };
      }
      orig.call(this, type, listener, op);
    };
  });
})();

// ───────────────────────────────────────────────────────────────────
// BULLETPROOF STALE-SHELL WATCHDOG
// boot.js is served from a STABLE path (/scripts/boot.js), so it runs even
// when every hashed bundle 404s after a deploy. If the JS bundles fail to load
// (stale index.html pointing at bundles from a previous deploy), React never
// mounts and the user is stuck on a blank/spinning screen — and none of the
// in-bundle recovery code can run. This watchdog is the last line of defense:
// if #root never gets any children, it wipes the service worker + caches and
// hard-reloads to the fresh build. Self-contained vanilla JS, no dependencies.
(function() {
  var COUNT_KEY = 'swipess_shell_recover_count';

  function hardReloadFresh() {
    try {
      location.replace(location.pathname + '?v=' + Date.now());
    } catch (e) {
      try { location.reload(); } catch (e2) {}
    }
  }

  function recover(reason) {
    // Guard against infinite reload loops — give up after 2 attempts per tab session.
    try {
      var n = parseInt(sessionStorage.getItem(COUNT_KEY) || '0', 10);
      if (n >= 2) return;
      sessionStorage.setItem(COUNT_KEY, String(n + 1));
    } catch (e) {}

    var done = false;
    function finish() {
      if (done) return; done = true;
      hardReloadFresh();
    }
    // Failsafe: reload no matter what after 2s, even if cache/SW cleanup hangs.
    setTimeout(finish, 2000);

    var tasks = [];
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        tasks.push(
          navigator.serviceWorker.getRegistrations().then(function(regs) {
            return Promise.all(regs.map(function(r) { return r.unregister(); }));
          }).catch(function() {})
        );
      }
    } catch (e) {}
    try {
      if (window.caches && caches.keys) {
        tasks.push(
          caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) { return caches.delete(k); }));
          }).catch(function() {})
        );
      }
    } catch (e) {}

    if (tasks.length) {
      Promise.all(tasks).then(finish).catch(finish);
    } else {
      finish();
    }
  }

  // Fast path: a module/stylesheet failed to load (chunk 404) → recover now.
  window.addEventListener('error', function(e) {
    var t = e && e.target;
    if (t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
      recover('asset-load-error');
    }
  }, true);
  window.addEventListener('vite:preloadError', function() {
    recover('vite-preload-error');
  });

  // Watchdog: if React never mounts, the shell is broken → recover.
  // 10s grace covers slow networks; a healthy app mounts in well under that.
  setTimeout(function() {
    var rootEl = document.getElementById('root');
    var mounted = rootEl && rootEl.childElementCount > 0;
    if (mounted) {
      // App came up fine — clear the counter so a future deploy can recover again.
      try { sessionStorage.removeItem(COUNT_KEY); } catch (e) {}
    } else {
      recover('app-did-not-mount');
    }
  }, 10000);
})();
