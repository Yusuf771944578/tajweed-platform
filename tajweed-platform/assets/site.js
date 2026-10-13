/* site.js — التنقل الموحد + الوضع النهاري/الليلي (يعمل على كل الصفحات) */
(function () {
  var PAGES = [
    { h: 'index.html?v=13', t: 'الرئيسية', i: '⌂' },
    { h: 'demo-teacher-studio.html?v=10', t: 'الاستوديو', i: '◉' },
    { h: 'demo-skill-tree.html?v=13', t: 'الشجرة', i: '⑂' },
    { h: 'demo-lesson.html?v=13', t: 'الدرس', i: '♪' },
    { h: 'demo-mushaf.html?v=2', t: 'المصحف', i: '📖' },
    { h: 'demo-mutun.html?v=1', t: 'المتون', i: '📜' },
    { h: 'demo-teacher-board.html?v=1', t: 'اللوحة', i: '◍' },
    { h: 'demo-feedback.html?v=1', t: 'رأيك', i: '✎' },
];
  function cur() {
    var p = location.pathname.split('/').pop() || 'index.html?v=13';
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
      var on = (here === p.h.split('?')[0]) ? ' on' : '';
      return '<a class="tab' + on + '" href="' + p.h + '"><span class="ti">' + p.i + '</span><span>' + p.t + '</span></a>';
    }).join('') + '<button class="tab theme" id="themeBtn" onclick="toggleTheme()">☀</button>';
    document.body.appendChild(bar);
    try{
      if(!document.getElementById('creditBar')){
        var ft = document.createElement('footer');
        ft.id = 'creditBar';
        ft.className = 'credit';
        var wa = '<svg viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
        var ml = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
        ft.innerHTML = 'فكرة وإعداد أ. يوسف سيف &nbsp;•&nbsp; <a href="https://wa.me/967771944578" target="_blank" rel="noopener">' + wa + '<span dir="ltr">+967771944578</span></a> &nbsp;•&nbsp; <a href="mailto:YUSUFSEEF6@GMAIL.COM">' + ml + '<span dir="ltr">YUSUFSEEF6@GMAIL.COM</span></a>';
        document.body.appendChild(ft);
      }
    }catch(e){}
    apply(theme());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
/* PWA — التثبيت كتطبيق عند الرفع على خادم: قائمة + أيقونات + عامل خدمي (يُحقن في كل الصفحات) */
(function () {
  try {
    var h = document.head || document.getElementsByTagName('head')[0];
    function addLink(rel, href, attr) {
      var q = 'link[rel="' + rel + '"]';
      if (document.querySelector(q)) return;
      var l = document.createElement('link');
      l.rel = rel; l.href = href;
      if (attr) for (var k in attr) l.setAttribute(k, attr[k]);
      h.appendChild(l);
    }
    function addMeta(name, content) {
      if (document.querySelector('meta[name="' + name + '"]')) return;
      var m = document.createElement('meta');
      m.name = name; m.content = content;
      h.appendChild(m);
    }
    addLink('manifest', 'manifest.webmanifest');
    addLink('apple-touch-icon', 'assets/icons/icon-180.png');
    addLink('icon', 'assets/icons/icon.svg', { type: 'image/svg+xml' });
    addMeta('theme-color', '#0B1020');
    addMeta('mobile-web-app-capable', 'yes');
    addMeta('apple-mobile-web-app-capable', 'yes');
    addMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    addMeta('apple-mobile-web-app-title', 'التجويد');
  } catch (e) {}
  if ('serviceWorker' in navigator) {
    try {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    } catch (e) {}
  }
})();
