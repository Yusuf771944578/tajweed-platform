// ============================================================
// SkillTree.tsx — شجرة الأحكام التفاعلية (Gamified, شبابي رصين)
// Next.js + Tailwind CSS + Framer Motion
// npm i framer-motion
// يتوافق مع جدول SkillNode + UserProgress في prisma/schema.prisma
// الحالات: locked / available / in-progress / completed
// ============================================================
'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- الأنواع ----------
type NodeStatus = 'locked' | 'available' | 'in-progress' | 'completed';
type Stage = 'MIDDLE' | 'HIGH' | 'UNIVERSITY';

interface SkillNodeData {
  id: string;
  titleAr: string;
  subtitle: string;
  stage: Stage;
  tier: number;          // الصف في الشجرة (0 = القاعدة)
  xpReward: number;
  lessons: number;
  mastery: number;       // 0..1 (تقدم الطالب)
  status: NodeStatus;
  requires: string[];    // ids العقد السابقة
  ruleKey: string;
  estimateMin: number;
}

// ---------- بيانات تجريبية (تُستبدل لاحقاً بجلب من API) ----------
const NODES: SkillNodeData[] = [
  // Tier 0 — الأساس
  { id: 'n-noon-intro', titleAr: 'مدخل النون الساكنة', subtitle: 'الفرق بين السكون الأصلي والتنوين', stage: 'MIDDLE', tier: 0, xpReward: 50, lessons: 3, mastery: 1, status: 'completed', requires: [], ruleKey: 'noon', estimateMin: 10 },
  { id: 'n-makharij', titleAr: 'مخارج الحروف', subtitle: 'الحلق واللسان والشفتان', stage: 'MIDDLE', tier: 0, xpReward: 50, lessons: 4, mastery: 1, status: 'completed', requires: [], ruleKey: 'makharij', estimateMin: 12 },
  // Tier 1 — أحكام النون
  { id: 'n-izhar', titleAr: 'الإظهار الحلقي', subtitle: 'ء هـ ع ح غ خ', stage: 'MIDDLE', tier: 1, xpReward: 80, lessons: 5, mastery: 0.85, status: 'completed', requires: ['n-noon-intro'], ruleKey: 'izhar', estimateMin: 15 },
  { id: 'n-idgham', titleAr: 'الإدغام', subtitle: 'بغنة وبغير غنة — يرملون', stage: 'MIDDLE', tier: 1, xpReward: 100, lessons: 6, mastery: 0.45, status: 'in-progress', requires: ['n-noon-intro'], ruleKey: 'idgham', estimateMin: 20 },
  { id: 'n-iqlab', titleAr: 'الإقلاب', subtitle: 'النون + الباء ← ميم مخفاة', stage: 'HIGH', tier: 1, xpReward: 100, lessons: 4, mastery: 0, status: 'available', requires: ['n-noon-intro'], ruleKey: 'iqlab', estimateMin: 15 },
  // Tier 2 — الإخفاء والغنة
  { id: 'n-ikhfa', titleAr: 'الإخفاء الحقيقي', subtitle: '15 حرفاً + غنة حركتين', stage: 'HIGH', tier: 2, xpReward: 120, lessons: 6, mastery: 0, status: 'available', requires: ['n-idgham', 'n-iqlab'], ruleKey: 'ikhfa', estimateMin: 25 },
  { id: 'n-ghunna', titleAr: 'أزمنة الغنة', subtitle: 'مختبر الصوت: قِس غنتك', stage: 'HIGH', tier: 2, xpReward: 150, lessons: 4, mastery: 0, status: 'locked', requires: ['n-ikhfa'], ruleKey: 'ghunna', estimateMin: 20 },
  { id: 'n-meem', titleAr: 'أحكام الميم الساكنة', subtitle: 'إخفاء شفوي • إدغام • إظهار', stage: 'HIGH', tier: 2, xpReward: 120, lessons: 5, mastery: 0, status: 'locked', requires: ['n-izhar'], ruleKey: 'meem', estimateMin: 20 },
  // Tier 3 — المدود والاحتراف
  { id: 'n-madd', titleAr: 'المدود', subtitle: 'طبيعي • متصل • منفصل • عارض', stage: 'UNIVERSITY', tier: 3, xpReward: 180, lessons: 8, mastery: 0, status: 'locked', requires: ['n-ikhfa', 'n-meem'], ruleKey: 'madd', estimateMin: 30 },
  { id: 'n-qalqalah', titleAr: 'القلقلة', subtitle: 'قطب جد — صغرى وكبرى', stage: 'UNIVERSITY', tier: 3, xpReward: 150, lessons: 4, mastery: 0, status: 'locked', requires: ['n-meem'], ruleKey: 'qalqalah', estimateMin: 15 },
  { id: 'n-itqan', titleAr: 'الإتقان الشامل', subtitle: 'تطبيق على جزء عم كاملاً', stage: 'UNIVERSITY', tier: 4, xpReward: 300, lessons: 10, mastery: 0, status: 'locked', requires: ['n-madd', 'n-qalqalah'], ruleKey: 'itqan', estimateMin: 45 },
];

const STAGE_LABEL: Record<Stage, string> = {
  MIDDLE: 'الإعدادية',
  HIGH: 'الثانوية',
  UNIVERSITY: 'الجامعية',
};

// أيقونات SVG رصينة (خطية، بدون كرتون)
function NodeIcon({ ruleKey, className = 'h-6 w-6' }: { ruleKey: string; className?: string }) {
  const common = `fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round ${className}`;
  switch (ruleKey) {
    case 'izhar':
      return (<svg viewBox="0 0 24 24" className={common}><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>); // إظهار = وضوح/انفتاح
    case 'idgham':
      return (<svg viewBox="0 0 24 24" className={common}><path d="M4 12h6l2-5 3 10 2-5h3" /></svg>); // اندماج موجة
    case 'ikhfa':
      return (<svg viewBox="0 0 24 24" className={common}><path d="M3 12s3.5-6 9-6c2.5 0 4.5 1.2 6 3M21 12s-3.5 6-9 6c-2.5 0-4.5-1.2-6-3" /><path d="M4 4l16 16" /></svg>); // إخفاء = عين محجوبة
    case 'ghunna':
      return (<svg viewBox="0 0 24 24" className={common}><path d="M4 10v4h4l5 4V6l-5 4H4z" /><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" /></svg>); // صوت
    case 'madd':
      return (<svg viewBox="0 0 24 24" className={common}><path d="M3 12h18M5 12V7m4 5V7m4 5V7m4 5V7m4 5V7" /></svg>); // امتداد
    case 'qalqalah':
      return (<svg viewBox="0 0 24 24" className={common}><path d="M12 3v10" /><circle cx="12" cy="17" r="4" /><path d="M12 15.5v.01" /></svg>); // اهتزاز/ارتداد
    case 'meem':
      return (<svg viewBox="0 0 24 24" className={common}><rect x="4" y="7" width="16" height="10" rx="2" /><path d="M4 10h16" /></svg>);
    case 'iqlab':
      return (<svg viewBox="0 0 24 24" className={common}><path d="M7 8h11l-3-3M17 16H6l3 3" /></svg>); // قلب/تبديل
    case 'itqan':
      return (<svg viewBox="0 0 24 24" className={common}><path d="M12 2l2.5 6.5L21 11l-5 4.5L17.5 22 12 18.5 6.5 22 8 15.5 3 11l6.5-2.5L12 2z" /></svg>); // تاج الإتقان
    default:
      return (<svg viewBox="0 0 24 24" className={common}><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" /></svg>);
  }
}

// ---------- المكوّن ----------
export default function SkillTree() {
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string>('n-idgham');
  const [startedIds, setStartedIds] = useState<string[]>([]);

  const tiers = useMemo(() => {
    const list = stageFilter === 'ALL' ? NODES : NODES.filter((n) => n.stage === stageFilter);
    const map = new Map<number, SkillNodeData[]>();
    list.forEach((n) => {
      if (!map.has(n.tier)) map.set(n.tier, []);
      map.get(n.tier)!.push(n);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [stageFilter]);

  const selected = NODES.find((n) => n.id === selectedId)!;
  const totalXp = NODES.filter((n) => n.status === 'completed').reduce((s, n) => s + n.xpReward, 0);
  const completedCount = NODES.filter((n) => n.status === 'completed').length;
  const progressPct = Math.round((completedCount / NODES.length) * 100);

  const statusStyle = (s: NodeStatus) => {
    switch (s) {
      case 'completed': return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 shadow-[0_0_30px_-8px_rgba(16,185,129,.5)]';
      case 'in-progress': return 'border-sky-500/60 bg-sky-500/10 text-sky-300 shadow-[0_0_30px_-8px_rgba(56,189,248,.5)]';
      case 'available': return 'border-amber-400/50 bg-amber-400/5 text-amber-200 shadow-[0_0_30px_-10px_rgba(251,191,36,.45)]';
      default: return 'border-white/10 bg-white/[.03] text-slate-500';
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B1020] text-slate-100">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        {/* ===== شريط التقدم العلوي ===== */}
        <header className="mb-6 rounded-2xl border border-white/10 bg-white/[.04] p-4 md:p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold">شجرة الأحكام <span className="text-emerald-400">— مسار الإتقان</span></h1>
              <p className="mt-1 text-xs text-slate-400">أتقن حكماً لتفتح التالي — {completedCount} من {NODES.length} مكتملة</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 font-bold text-amber-300">⚡ {totalXp} XP</span>
              <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 font-bold text-orange-300">🔥 سلسلة 7 أيام</span>
              <span className="rounded-full bg-violet-500/10 border border-violet-500/30 px-3 py-1 font-bold text-violet-300">مجوّد</span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ type: 'spring', stiffness: 60, damping: 20 }}
              className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-sky-400" />
          </div>
          {/* فلتر المراحل */}
          <div className="mt-3 flex gap-2">
            {(['ALL', 'MIDDLE', 'HIGH', 'UNIVERSITY'] as const).map((s) => (
              <button key={s} onClick={() => setStageFilter(s)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${stageFilter === s ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                {s === 'ALL' ? 'الكل' : STAGE_LABEL[s]}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* ===== الشجرة ===== */}
          <main className="rounded-2xl border border-white/10 bg-white/[.02] p-4 md:p-6">
            {tiers.map(([tier, nodes], ti) => (
              <div key={tier}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500">المستوى {tier + 1}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-white/15 to-transparent" />
                </div>
                <div className="relative mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {nodes.map((n, i) => {
                    const isSel = n.id === selectedId;
                    const locked = n.status === 'locked';
                    return (
                      <motion.button
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ti * 0.08 + i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                        whileHover={locked ? {} : { y: -4 }}
                        whileTap={locked ? {} : { scale: 0.97 }}
                        onClick={() => setSelectedId(n.id)}
                        className={`relative rounded-2xl border p-4 text-right transition ${statusStyle(n.status)} ${isSel ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0B1020]' : ''} ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {/* نبض للعقد المتاحة */}
                        {n.status === 'available' && (
                          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute left-3 top-3 h-2 w-2 rounded-full bg-amber-400" />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${n.status === 'locked' ? 'bg-white/5' : 'bg-black/30'}`}>
                            {locked ? (
                              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
                            ) : <NodeIcon ruleKey={n.ruleKey} />}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {n.status === 'completed' && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">✓ مكتمل</span>}
                            {n.status === 'in-progress' && <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">جارٍ {Math.round(n.mastery * 100)}%</span>}
                            {n.status === 'available' && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">متاح الآن</span>}
                            {n.status === 'locked' && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold">مغلق</span>}
                            <span className="text-[10px] text-slate-400">{STAGE_LABEL[n.stage]}</span>
                          </div>
                        </div>
                        <h3 className={`mt-3 font-extrabold ${locked ? 'text-slate-500' : ''}`}>{n.titleAr}</h3>
                        <p className="mt-0.5 text-xs text-slate-400">{n.subtitle}</p>
                        {/* شريط الإتقان */}
                        {(n.status === 'in-progress' || n.status === 'completed') && (
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/40">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${n.mastery * 100}%` }}
                              className={`h-full rounded-full ${n.status === 'completed' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>⚡ {n.xpReward} XP</span>
                          <span>{n.lessons} دروس • {n.estimateMin} د</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </main>

          {/* ===== لوحة التفاصيل ===== */}
          <aside className="lg:sticky lg:top-4 h-fit rounded-2xl border border-white/10 bg-white/[.04] p-5 backdrop-blur">
            <AnimatePresence mode="wait">
              <motion.div key={selected.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${statusStyle(selected.status)}`}>
                    <NodeIcon ruleKey={selected.ruleKey} className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold">{selected.titleAr}</h2>
                    <p className="text-xs text-slate-400">{selected.subtitle} • {STAGE_LABEL[selected.stage]}</p>
                  </div>
                </div>

                {/* الإحصائيات */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-black/30 p-2.5"><div className="text-lg font-extrabold text-amber-300">⚡{selected.xpReward}</div><div className="text-[10px] text-slate-400">نقاط XP</div></div>
                  <div className="rounded-xl bg-black/30 p-2.5"><div className="text-lg font-extrabold">{selected.lessons}</div><div className="text-[10px] text-slate-400">دروس</div></div>
                  <div className="rounded-xl bg-black/30 p-2.5"><div className="text-lg font-extrabold">{selected.estimateMin}د</div><div className="text-[10px] text-slate-400">المدة</div></div>
                </div>

                {/* الإتقان */}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">الإتقان</span><span className="font-bold">{Math.round(selected.mastery * 100)}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${selected.mastery * 100}%` }} className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-sky-400" />
                  </div>
                </div>

                {/* المتطلبات */}
                {selected.requires.length > 0 && (
                  <div className="mt-4 text-xs">
                    <span className="font-bold text-slate-300">المتطلبات: </span>
                    {selected.requires.map((r) => {
                      const dep = NODES.find((x) => x.id === r)!;
                      const done = dep.status === 'completed';
                      return <span key={r} className={`mr-1 inline-block rounded-full px-2 py-0.5 font-bold ${done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>{done ? '✓ ' : ''}{dep.titleAr}</span>;
                    })}
                  </div>
                )}

                {/* زر البدء */}
                {selected.status === 'locked' ? (
                  <button disabled className="mt-5 w-full cursor-not-allowed rounded-xl bg-white/5 py-3 text-sm font-bold text-slate-500">🔒 مغلق — أتقن المتطلبات أولاً</button>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setStartedIds((s) => (s.includes(selected.id) ? s : [...s, selected.id]))}
                    className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400">
                    {selected.status === 'completed' ? '↻ مراجعة الدرس' : selected.status === 'in-progress' ? '▶ إكمال من حيث توقفت' : '▶ ابدأ التحدي — +'} 
                    {selected.status === 'available' ? `${selected.xpReward} XP` : ''}
                  </motion.button>
                )}
                {startedIds.includes(selected.id) && selected.status !== 'locked' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center text-xs text-emerald-300">تم تسجيل بدء الجلسة — بالتوفيق! (تُربط لاحقاً بصفحة الدرس/التحدي)</motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </div>
  );
}
