(function () {
  var FLAG_KEY = 'aria_skip_views';
  var API = 'https://events.vercount.one/api/v2/log';
  var SCRIPT_SRC = 'https://events.vercount.one/js';

  function readFlag() {
    try {
      if (localStorage.getItem(FLAG_KEY) === '1') return true;
    } catch (e) {}
    return document.cookie.split('; ').indexOf(FLAG_KEY + '=1') !== -1;
  }

  function writeFlag(on) {
    try {
      if (on) localStorage.setItem(FLAG_KEY, '1');
      else localStorage.removeItem(FLAG_KEY);
    } catch (e) {}
    document.cookie = on
      ? FLAG_KEY + '=1; path=/; max-age=31536000; samesite=lax'
      : FLAG_KEY + '=; path=/; max-age=0; samesite=lax';
  }

  function stripOwnerParams() {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has('owner') && !url.searchParams.has('skipviews')) return;
      url.searchParams.delete('owner');
      url.searchParams.delete('skipviews');
      var next = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      history.replaceState(null, '', next);
    } catch (e) {}
  }

  function applyOwnerQuery() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return;
    }
    var owner = params.get('owner');
    var skip = params.get('skipviews');
    if (owner === '1' || skip === '1') writeFlag(true);
    else if (owner === '0' || skip === '0') writeFlag(false);
    stripOwnerParams();
  }

  function isLocalHost() {
    var host = (window.location.hostname || '').toLowerCase();
    if (!host) return true;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '[::1]' || host === '::1') return true;
    if (host.endsWith('.local') || host.endsWith('.localhost')) return true;
    if (/^192\.168\./.test(host) || /^10\./.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
    return window.location.protocol === 'file:';
  }

  function isOwnerTraffic() {
    return isLocalHost() || readFlag();
  }

  function pageUrl() {
    return window.location.origin + window.location.pathname;
  }

  function fillPagePv(value) {
    var el = document.getElementById('vercount_value_page_pv');
    if (!el || value == null || value === '') return;
    el.textContent = String(value);
  }

  function readCounts() {
    var url = pageUrl();
    if (!/^https?:/.test(url)) return;
    fetch(API + '?url=' + encodeURIComponent(url))
      .then(function (res) { return res.json(); })
      .then(function (payload) {
        var data = (payload && payload.data) || payload || {};
        fillPagePv(data.page_pv);
      })
      .catch(function () {});
  }

  function countVisit() {
    var s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.defer = true;
    document.head.appendChild(s);
  }

  applyOwnerQuery();

  if (!document.getElementById('vercount_value_page_pv')) return;
  if (isOwnerTraffic()) readCounts();
  else countVisit();
})();
