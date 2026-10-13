/* cloud.js — طبقة المزامنة السحابية (Supabase) بنمط local-first.
   بدون إعداد: كل شيء يعمل محلياً كما هو. مع الإعداد: تُرفع الأحداث والتقدم تلقائياً.
   التفعيل: افتح أي صفحة مرة واحدة بهذا الشكل:
   index.html?cloud=https://xyz.supabase.co&ckey=YOUR_ANON_KEY
   (يُحفظ في جهازك فقط. مفتاح anon عام بطبيعته، والحماية عبر RLS في السيرفر) */
window.CLOUD = (function () {
  var LS_CFG = 'tajweed_cloud_cfg', LS_OUT = 'tajweed_outbox', LS_DEV = 'tajweed_device', LS_SYN = 'tajweed_synced';
  var cfg = { url: 'https://uiduazvdpkrizwrqegka.supabase.co', key: 'sb_publishable_6fLZj6z11HmnTg9GBRzd8g_V8HYYfis' };
  try {
    var saved = JSON.parse(localStorage.getItem(LS_CFG) || 'null');
    if (saved && saved.url) cfg = saved;
    var q = null;
    try { q = new URLSearchParams(location.search); } catch (e) {}
    if (q && q.get('cloud')) {
      cfg = { url: q.get('cloud'), key: q.get('ckey') || '' };
      try { localStorage.setItem(LS_CFG, JSON.stringify(cfg)); } catch (e) {}
    }
  } catch (e) {}
  function device() {
    try {
      var d = localStorage.getItem(LS_DEV);
      if (!d) {
        d = 'd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(LS_DEV, d);
      }
      return d;
    } catch (e) { return 'd-anon'; }
  }
  function enabled() { return !!(cfg.url && cfg.key && typeof fetch !== 'undefined'); }
  function outbox() { try { return JSON.parse(localStorage.getItem(LS_OUT) || '[]'); } catch (e) { return []; } }
  function saveBox(b) { try { localStorage.setItem(LS_OUT, JSON.stringify(b.slice(-300))); } catch (e) {} }
  function headers() { return { 'apikey': cfg.key, 'Authorization': 'Bearer ' + cfg.key, 'Content-Type': 'application/json' }; }
  function dot(state, title) {
    try {
      var el = document.getElementById('cloudDot');
      if (!el) return;
      el.textContent = state === 'on' ? '☁ متصل' : (state === 'busy' ? '☁ …' : '☁ محلي');
      el.title = title || '';
    } catch (e) {}
  }
  function mountDot() {
    try {
      if (document.getElementById('cloudDot')) return;
      var bar = document.querySelector('.tabbar');
      if (!bar) return;
      var s = document.createElement('span');
      s.id = 'cloudDot';
      s.style.cssText = 'position:fixed;top:8px;left:8px;z-index:60;font-size:11px;font-weight:700;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.15);border-radius:9999px;padding:2px 8px;color:#94a3b8';
      s.textContent = '☁ محلي';
      document.body.appendChild(s);
      dot(enabled() ? 'busy' : 'off', enabled() ? '' : 'يعمل محلياً — أضف مفاتيح Supabase للمزامنة');
    } catch (e) {}
  }
  /* تسجيل حدث في صندوق الصادر المحلي */
  function log(type, payload) {
    try {
      var b = outbox();
      b.push({ type: type, payload: payload || {}, ts: Date.now(), dev: device() });
      saveBox(b);
    } catch (e) {}
    schedule();
  }
  var timer = null, flushing = false;
  function schedule() {
    if (!enabled()) { dot('off'); return; }
    if (timer) return;
    timer = setTimeout(function () { timer = null; flush(); }, 4000);
  }
  /* لقطة التقدم المحلي → صفوف جاهزة للرفع */
  function snapshot() {
    var rows = { profile: null, progress: [], mistakes: [] };
    try {
      var xp = 0, st = 0;
      try { xp = window.XP ? XP.get() : 0; st = window.XP ? XP.streak() : 0; } catch (e) {}
      var rk = 'مبتدئ';
      try { rk = window.XP ? XP.rank() : rk; } catch (e) {}
      rows.profile = { device_id: device(), xp_total: xp, streak: st, rank: rk, updated_at: new Date().toISOString() };
      var P = JSON.parse(localStorage.getItem('tajweed_tree_v2') || 'null');
      if (P && P.nodes) {
        for (var id in P.nodes) {
          if (!P.nodes.hasOwnProperty(id)) continue;
          var n = P.nodes[id];
          rows.progress.push({ device_id: device(), node_id: id, mastery: n.m || 0, attempts: n.att || 0, best: n.best || 0, updated_at: new Date().toISOString() });
        }
        (P.mistakes || []).slice(-50).forEach(function (m) {
          rows.mistakes.push({ device_id: device(), question: String(m.q || '').slice(0, 200), answer: String(m.ok || '').slice(0, 200) });
        });
      }
    } catch (e) {}
    return rows;
  }
  function lastSyn() { try { return localStorage.getItem(LS_SYN) || ''; } catch (e) { return ''; } }
  function markSyn(h) { try { localStorage.setItem(LS_SYN, h); } catch (e) {} }
  /* الرفع: profile + progress + mistakes + أحداث XP المتراكمة */
  function flush() {
    if (!enabled() || flushing || !navigator.onLine) return;
    flushing = true;
    dot('busy', 'جارٍ المزامنة…');
    var snap = snapshot();
    var sig = JSON.stringify([snap.profile.xp_total, snap.progress.length]);
    var jobs = [];
    jobs.push(fetch(cfg.url + '/rest/v1/profiles', {
      method: 'POST', headers: headers(),
      body: JSON.stringify(snap.profile)
    }).then(function (r) { if (!r.ok && r.status !== 409) throw 0; }));
    snap.progress.forEach(function (p) {
      jobs.push(fetch(cfg.url + '/rest/v1/progress', {
        method: 'POST', headers: headers(),
        body: JSON.stringify(p)
      }).then(function (r) { if (!r.ok && r.status !== 409) throw 0; }).catch(function () {}));
    });
    var box = outbox();
    var evs = box.filter(function (e) { return e.type === 'xp'; }).slice(-100).map(function (e) {
      return { device_id: device(), amount: e.payload.amount || 0, source: e.payload.source || 'app', meta: e.payload.meta || {} };
    });
    if (evs.length) {
      jobs.push(fetch(cfg.url + '/rest/v1/xp_events', {
        method: 'POST', headers: headers(),
        body: JSON.stringify(evs)
      }).then(function () {
        saveBox(outbox().filter(function (e) { return e.type !== 'xp'; }));
      }).catch(function () {}));
    }
    Promise.all(jobs).then(function () {
      flushing = false;
      markSyn(sig);
      dot('on', 'تمت المزامنة');
    }).catch(function () {
      flushing = false;
      dot('off', 'تعذر الاتصال — سيُعاد لاحقاً');
      schedule();
    });
  }
  /* ربط تلقائي: كل XP يُسجل حدثاً */
  function hook() {
    try {
      if (window.XP && !window.XP._hooked) {
        window.XP._hooked = true;
        var orig = window.XP.add;
        window.XP.add = function (n) {
          var r = orig(n);
          log('xp', { amount: Math.round(n || 0), source: 'app', meta: {} });
          return r;
        };
      }
    } catch (e) {}
  }
  function init() {
    mountDot();
    hook();
    try { setInterval(hook, 5000); } catch (e) {}
    if (enabled()) {
      dot('busy');
      setTimeout(flush, 6000);
      try { setInterval(function () { if (navigator.onLine) flush(); }, 60000); } catch (e) {}
      try { window.addEventListener('online', flush); } catch (e) {}
    } else {
      dot('off', 'يعمل محلياً — أضف مفاتيح Supabase للمزامنة');
    }
  }
  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  } catch (e) {}
  return { log: log, flush: flush, enabled: enabled, device: device };
})();
