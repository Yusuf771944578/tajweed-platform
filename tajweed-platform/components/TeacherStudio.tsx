// ============================================================
// TeacherStudio.tsx — استوديو المعلم التفاعلي
// Next.js + Tailwind CSS + Framer Motion
// npm i framer-motion
// الخط العثماني: يُحمَّل في app/layout.tsx أو globals.css
// @font-face { font-family:'KFGQPC Uthman Taha Naskh';
//   src:url('https://cdn.jsdelivr.net/gh/mustafa0x/qpc-fonts@master/KFGQPC_Uthman_Taha_Naskh.woff2') format('woff2'); }
// قاعدة ذهبية: لا تقسّم الكلمة إلى حروف <span> — قسّم على مستوى الكلمة فقط
// حتى لا ينكسر اتصال الحروف العربية ورسم المصحف.
// ============================================================
'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- أنواع البيانات ----------
type RuleId = 'izhar' | 'idgham' | 'ikhfa' | 'qalqalah';

interface WordToken {
  text: string;       // الكلمة بالرسم العثماني Unicode
  tag?: 'noon' | 'trigger' | 'normal'; // دور الكلمة في الحكم
  note?: string;
}

interface Example {
  id: string;
  ref: string;        // "البقرة 74"
  rule: RuleId;
  triggerLetter: string;
  words: WordToken[];
  explanation: string;
}

// ---------- بيانات تجريبية بالرسم العثماني (Tanzil Uthmani) ----------
const EXAMPLES: Example[] = [
  {
    id: 'ex1',
    ref: 'البقرة 74 — ﴿مِنْ خَشْيَةِ﴾',
    rule: 'izhar',
    triggerLetter: 'خ',
    words: [
      { text: 'مِنْ', tag: 'noon', note: 'نون ساكنة' },
      { text: 'خَشْيَةِ', tag: 'trigger', note: 'حرف الإظهار: خ' },
      { text: 'ٱللَّهِ', tag: 'normal' },
    ],
    explanation:
      'نون ساكنة + خ (من حروف الحلق الستة ء هـ ع ح غ خ) → إظهار حلقي: نطق النون واضحة من مخرجها مع تباعد بينها وبين الخاء.',
  },
  {
    id: 'ex2',
    ref: 'النساء 57 — ﴿مِّنْ حَكِيمٍ﴾',
    rule: 'izhar',
    triggerLetter: 'ح',
    words: [
      { text: 'عَلِيمًا', tag: 'normal' },
      { text: 'حَكِيمًا', tag: 'trigger', note: 'حرف الإظهار: ح' },
    ],
    explanation:
      'تنوين + ح → إظهار حلقي. التنوين نون ساكنة لفظاً تُنطق مظهرة قبل الحاء لتباعد المخرجين.',
  },
  {
    id: 'ex3',
    ref: 'الإخلاص 1 — مثال تعليمي للقلقلة',
    rule: 'qalqalah',
    triggerLetter: 'ق',
    words: [
      { text: 'قُلْ', tag: 'trigger', note: 'القاف مقلقلة ساكنة' },
      { text: 'هُوَ', tag: 'normal' },
      { text: 'ٱللَّهُ', tag: 'normal' },
      { text: 'أَحَدٌ', tag: 'normal' },
    ],
    explanation:
      'القاف من حروف (قطب جد) الساكنة → قلقلة صغرى: اهتزاز المخرج دون ميل للفتح أو الكسر.',
  },
  {
    id: 'ex4',
    ref: 'البقرة 3 — مثال الإخفاء',
    rule: 'ikhfa',
    triggerLetter: 'ف',
    words: [
      { text: 'مِن', tag: 'noon', note: 'نون ساكنة' },
      { text: 'فَضْلِ', tag: 'trigger', note: 'حرف الإخفاء: ف' },
      { text: 'ٱللَّهِ', tag: 'normal' },
    ],
    explanation:
      'نون ساكنة + ف → إخفاء حقيقي بغنة مرققة بمقدار حركتين لعدم القرب ولا البعد.',
  },
];

const RULE_META: Record<RuleId, { title: string; noon: string; trigger: string; hint: string }> = {
  izhar: {
    title: 'الإظهار الحلقي',
    noon: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/60',
    trigger: 'bg-amber-500/20 text-amber-300 ring-amber-400/60',
    hint: 'النون واضحة + حرف حلقي — لاحظ التباعد بين المخرجين',
  },
  idgham: {
    title: 'الإدغام',
    noon: 'bg-sky-500/20 text-sky-300 ring-sky-400/60',
    trigger: 'bg-violet-500/20 text-violet-300 ring-violet-400/60',
    hint: 'النون تدخل في الحرف التالي — اندماج المخرجين',
  },
  ikhfa: {
    title: 'الإخفاء الحقيقي',
    noon: 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/60',
    trigger: 'bg-fuchsia-500/20 text-fuchsia-300 ring-fuchsia-400/60',
    hint: 'حالة بين الإظهار والإدغام مع غنة حركتين',
  },
  qalqalah: {
    title: 'القلقلة',
    noon: 'bg-slate-500/20 text-slate-200 ring-slate-400/60',
    trigger: 'bg-rose-500/20 text-rose-300 ring-rose-400/60',
    hint: 'اهتزاز حرف قطب جد الساكن — اسمع الارتداد',
  },
};

// ---------- المكوّن الرئيسي ----------
export default function TeacherStudio() {
  const [activeRule, setActiveRule] = useState<RuleId>('izhar');
  const [activeId, setActiveId] = useState('ex1');
  const [query, setQuery] = useState('');
  const [isolate, setIsolate] = useState(true); // فصل حروف الحكم عن الكلمة
  const [dark, setDark] = useState(true);

  const active = EXAMPLES.find((e) => e.id === activeId) ?? EXAMPLES[0];

  // مستدعي الأمثلة الفوري: بحث بالحكم أو حرف أو مرجع
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return EXAMPLES.filter((e) => e.rule === activeRule);
    return EXAMPLES.filter(
      (e) =>
        e.ref.includes(q) ||
        e.triggerLetter.includes(q) ||
        e.explanation.includes(q) ||
        RULE_META[e.rule].title.includes(q) ||
        q.includes('اظهار') && e.rule === 'izhar' ||
        q.includes('اخفاء') && e.rule === 'ikhfa' ||
        q.includes('قلقل') && e.rule === 'qalqalah'
    );
  }, [query, activeRule]);

  const meta = RULE_META[active.rule];
  const noonWord = active.words.find((w) => w.tag === 'noon');
  const triggerWord = active.words.find((w) => w.tag === 'trigger');

  return (
    <div dir="rtl" className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0B1020] dark:text-slate-100 transition-colors">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          {/* ===== الترويسة ===== */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                استوديو المعلم التفاعلي <span className="text-emerald-500">— السبورة الديناميكية</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                خط عثماني رسمي + تحريك تفاعلي للأحكام — انقر أي كلمة لعزل حكمها
              </p>
            </div>
            <button
              onClick={() => setDark((d) => !d)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-200 dark:border-white/15 dark:hover:bg-white/10"
            >
              {dark ? '☀ وضع فاتح' : '🌙 وضع داكن'}
            </button>
          </header>

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            {/* ===== مستدعي الأمثلة الفوري ===== */}
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                مستدعي الأمثلة الفوري — اكتب: إظهار / خ / البقرة…
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="مثال: إظهار حلقي مع حرف الخاء"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-black/30"
              />
              {/* أزرار الأحكام */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(Object.keys(RULE_META) as RuleId[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setActiveRule(r); const f = EXAMPLES.find((x) => x.rule === r); if (f) setActiveId(f.id); }}
                    className={`rounded-xl px-2 py-2 text-sm font-bold transition ${
                      activeRule === r
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {RULE_META[r].title}
                  </button>
                ))}
              </div>
              {/* النتائج */}
              <div className="mt-3 space-y-2">
                <AnimatePresence>
                  {results.map((ex) => (
                    <motion.button
                      key={ex.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => { setActiveId(ex.id); setActiveRule(ex.rule); }}
                      className={`w-full rounded-xl border p-3 text-right transition ${
                        ex.id === activeId
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-200 hover:border-emerald-400 dark:border-white/10 dark:hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="font-quran text-xl leading-loose">
                        {ex.words.map((w) => w.text).join(' ')}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {ex.ref} • حرف {ex.triggerLetter}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {results.length === 0 && (
                  <p className="text-sm text-slate-500">لا نتائج — جرّب: خ / إظهار / قلقلة</p>
                )}
              </div>
            </aside>

            {/* ===== السبورة ===== */}
            <main className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">
                  {meta.title} — {active.ref}
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={isolate} onChange={(e) => setIsolate(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
                  فصل حروف الحكم (عزل بصري)
                </label>
              </div>

              {/* الآية بخط عثماني — تقسيم كلمات فقط */}
              <div className="font-quran mt-6 rounded-2xl bg-slate-50 p-6 text-center text-4xl md:text-5xl leading-[2.2] dark:bg-black/30">
                <AnimatePresence mode="popLayout">
                  {active.words.map((w, i) => (
                    <motion.span
                      key={active.id + '-' + i}
                      layout
                      initial={{ opacity: 0, scale: 0.85, y: 12 }}
                      animate={{
                        opacity: 1,
                        scale: w.tag !== 'normal' && isolate ? 1.18 : 1,
                        y: w.tag !== 'normal' && isolate ? -6 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                      className={`mx-2 inline-block cursor-pointer rounded-xl px-3 ring-2 ring-transparent transition ${
                        w.tag === 'noon' ? meta.noon : w.tag === 'trigger' ? meta.trigger : 'hover:bg-slate-200/60 dark:hover:bg-white/10'
                      } ${w.tag !== 'normal' ? 'ring-2' : ''}`}
                      title={w.note ?? ''}
                    >
                      {w.text}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">{meta.hint}</p>

              {/* مخطط التباعد: النون vs حرف الإظهار */}
              <AnimatePresence>
                {isolate && noonWord && triggerWord && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <motion.div layoutId={`box-${active.id}-noon`} className={`rounded-2xl p-5 text-center ring-2 ${meta.noon}`}>
                        <div className="font-quran text-5xl">{noonWord.text}</div>
                        <div className="mt-2 text-xs font-bold">نون ساكنة — مخرج طرف اللسان</div>
                      </motion.div>
                      <motion.div
                        animate={{ x: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.6 }}
                        className="text-center"
                      >
                        <div className="text-2xl">↔</div>
                        <div className="text-[11px] font-bold text-slate-500">تباعد<br />= إظهار</div>
                      </motion.div>
                      <motion.div layoutId={`box-${active.id}-trigger`} className={`rounded-2xl p-5 text-center ring-2 ${meta.trigger}`}>
                        <div className="font-quran text-5xl">{triggerWord.text}</div>
                        <div className="mt-2 text-xs font-bold">حرف الحلق ({active.triggerLetter}) — أقصى/وسط الحلق</div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* الشرح */}
              <motion.div key={active.id + '-exp'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm leading-7">
                <span className="font-extrabold text-emerald-600 dark:text-emerald-300">التعليل: </span>
                {active.explanation}
              </motion.div>
            </main>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            ملاحظة هندسية: التظليل على مستوى الكلمة يحافظ على اتصال الحروف. عزل الحرف المفرد يكون في البطاقات التحليلية أسفل السبورة فقط، وليس بتفكيك كلمة المصحف نفسها.
          </p>
        </div>
      </div>
      {/* خط عثماني — أضف هذا في globals.css الحقيقي */}
      <style>{`.font-quran{font-family:'KFGQPC Uthman Taha Naskh','Amiri Quran',serif;}`}</style>
    </div>
  );
}
