/* Cloudy Game Dev Kits — copy buttons */
(function () {
  'use strict';
  function copyText(text, btn) {
    function ok() {
      if (!btn) return;
      var prev = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', prev);
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(function () { btn.textContent = prev; btn.classList.remove('copied'); }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(function () { fallback(text, ok); });
    } else fallback(text, ok);
  }
  function fallback(text, ok) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (err) {}
    document.body.removeChild(ta);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-target]');
    if (!btn) return;
    e.preventDefault();
    var el = document.querySelector(btn.getAttribute('data-copy-target'));
    if (el) copyText(el.textContent.replace(/^\n+/, '').replace(/\n+$/, ''), btn);
  });
})();
