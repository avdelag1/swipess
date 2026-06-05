(function() {
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
