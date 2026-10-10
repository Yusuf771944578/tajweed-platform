/* site.js — التنقل الموحد + الوضع النهاري/الليلي (يعمل على كل الصفحات) */
(function () {
  var PAGES = [
    { h: 'index.html', t: 'الرئيسية', i: '⌂' },
    { h: 'demo-teacher-studio.html', t: 'الاستوديو', i: '◉' },
    { h: 'demo-skill-tree.html', t: 'الشجرة', i: '⑂' },
    { h: 'demo-lesson.html', t: 'الدرس', i: '♪' },
    { h: 'demo-time-attack.html', t: 'السرعة', i: '⚡' },
    { h: 'demo-duel.html', t: 'النزال', i: '⚔' },
    { h: 'demo-leaderboard.html', t: 'الصدارة', i: '★' }
  ];
  function cur() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }
  function theme() {
    try { return localStorage.getItem('tajweed_theme') || 'dark'; } catch (e) { return 'dark'; }
  }
  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    var b = document.getElementById('themeBtn');
    if (b) b.textContent = t === 'dark' ? '☀' : '🌙';
    var L = document.querySelectorAll('.themeLbl');
    for (var i = 0; i < L.length; i++) L[i].textContent = t === 'dark' ? '☀ نهاري' : '🌙 ليلي';
  }
  window.toggleTheme = function () {
    var n = theme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('tajweed_theme', n); } catch (e) {}
    apply(n);
  };
  function mount() {
    apply(theme());
    var bar = document.createElement('nav');
    bar.className = 'tabbar';
    var here = cur();
    bar.innerHTML = PAGES.map(function (p) {
      var on = (here === p.h) ? ' on' : '';
      return '<a class="tab' + on + '" href="' + p.h + '"><span class="ti">' + p.i + '</span><span>' + p.t + '</span></a>';
    }).join('') + '<button class="tab theme" id="themeBtn" onclick="toggleTheme()">☀</button>';
    document.body.appendChild(bar);
    apply(theme());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
