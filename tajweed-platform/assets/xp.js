/* xp.js — مخزن نقاط مشترك (localStorage على جهاز الطالب)
   النسخة الساكنة تحفظ التقدم محلياً؛ النسخة الإنتاجية تستبدل هذا بـ API/XpEvent */
window.XP = (function () {
  var K = 'tajweed_xp_v1', S = 'tajweed_streak_v1';
  function get() { try { return parseInt(localStorage.getItem(K) || '0', 10) || 0; } catch (e) { return 0; } }
  function add(n) {
    n = Math.max(0, Math.round(n || 0));
    try { localStorage.setItem(K, String(get() + n)); } catch (e) {}
    touchStreak();
    return get();
  }
  function rank() {
    var x = get();
    if (x >= 5000) return 'مقرئ';
    if (x >= 2000) return 'متمكن';
    if (x >= 500) return 'مجوّد';
    return 'مبتدئ';
  }
  function touchStreak() {
    try {
      var t = new Date(); t.setHours(0, 0, 0, 0);
      var last = parseInt(localStorage.getItem(S + '_last') || '0', 10);
      var days = parseInt(localStorage.getItem(S) || '0', 10);
      if (last !== t.getTime()) {
        var y = new Date(t); y.setDate(y.getDate() - 1);
        days = (last === y.getTime()) ? days + 1 : 1;
        localStorage.setItem(S, String(days));
        localStorage.setItem(S + '_last', String(t.getTime()));
      }
    } catch (e) {}
  }
  function streak() { try { return parseInt(localStorage.getItem(S) || '0', 10) || 0; } catch (e) { return 0; } }
  return { get: get, add: add, rank: rank, streak: streak };
})();
