// ============================================================
// TimeAttackBlitz.tsx — تحدي السرعة والإتقان
// نمط "انقر الكلمة الصحيحة قبل نفاد الوقت" بخط عثماني
// XP = أساسي (20) + مكافأة سرعة (حتى 30) × مضاعف السلسلة (combo)
// POST /api/xp/time-attack عند النهاية
// ============================================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlitzQ {
  id: string; ref: string; prompt: string; rule: string;
  words: { t: string; ok: boolean }[];
}

const QUESTIONS: BlitzQ[] = [
  { id: 'b1', ref: 'البقرة 74', prompt: 'انقر كلمة الإظهار الحلقي (الحرف الحلقي)', rule: 'izhar',
    words: [{ t: 'مِنْ', ok: false }, { t: 'خَشْيَةِ', ok: true }, { t: 'ٱللَّهِ', ok: false }] },
  { id: 'b2', ref: 'الإخلاص 1', prompt: 'انقر الحرف المقلقَل (قطب جد)', rule: 'qalqalah',
    words: [{ t: 'قُلْ', ok: true }, { t: 'هُوَ', ok: false }, { t: 'أَحَدٌ', ok: false }] },
  { id: 'b3', ref: 'البقرة 3', prompt: 'انقر كلمة الإخفاء الحقيقي', rule: 'ikhfa',
    words: [{ t: 'مِن', ok: false }, { t: 'فَضْلِ', ok: true }, { t: 'ٱللَّهِ', ok: false }] },
  { id: 'b4', ref: 'النساء 57', prompt: 'أين الإظهار؟ (تنوين + ح)', rule: 'izhar',
    words: [{ t: 'عَلِيمًا', ok: false }, { t: 'حَكِيمًا', ok: true }] },
  { id: 'b5', ref: 'مثال الإدغام', prompt: 'انقر كلمة الإدغام بغنة (نون + ي)', rule: 'idgham',
    words: [{ t: 'مَن', ok: false }, { t: 'يَقُولُ', ok: true }] },
];

const TIME_PER_Q = 12; // ثانية

export default function TimeAttackBlitz({ userId = 'demo-user', onExit, onDone }:
  { userId?: string; onExit?: () => void; onDone?: (xp: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const [qi, setQi] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const [earned, setEarned] = useState<number[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = QUESTIONS[qi];

  useEffect(() => {
    if (phase !== 'play') return;
    setTimeLeft(TIME_PER_Q);
    timer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) { clearInterval(timer.current!); miss(); return 0; }
        return Math.round((t - 0.1) * 10) / 10;
      });
    }, 100);
    return () => clearInterval(timer.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qi]);

  const next = () => {
    if (qi + 1 >= QUESTIONS.length) { finish(); }
    else setQi((i) => i + 1);
  };

  const miss = () => {
    setCombo(0); setFlash('bad'); setEarned((e) => [...e, 0]);
    setTimeout(next, 450);
  };

  const pick = (ok: boolean) => {
    clearInterval(timer.current!);
    if (ok) {
      const speedBonus = Math.round((timeLeft / TIME_PER_Q) * 30); // حتى +30 للسرعة
      const mult = 1 + Math.min(combo, 4) * 0.25; // سلسلة حتى ×2
      const gain = Math.round((20 + speedBonus) * mult);
      setXp((x) => x + gain); setCorrect((c) => c + 1);
      const nc = combo + 1; setCombo(nc); setMaxCombo((m) => Math.max(m, nc));
      setFlash('good'); setEarned((e) => [...e, gain]);
    } else {
      setCombo(0); setFlash('bad'); setEarned((e) => [...e, 0]);
    }
    setTimeout(next, 450);
  };

  const finish = async () => {
    setPhase('result');
    const accuracy = correct / QUESTIONS.length;
    try {
      await fetch('/api/xp/time-attack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, xp, accuracy, maxCombo, correct, total: QUESTIONS.length }),
      });
    } catch { /* وضع العرض: يُحفظ محلياً */ }
    onDone?.(xp);
  };

  const accuracy = QUESTIONS.length ? correct / QUESTIONS.length : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B1020] text-slate-100">
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="mb-4 flex justify-between items-center">
          <button onClick={onExit} className="rounded-full bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10">→ خروج</button>
          {phase === 'play' && (
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 text-amber-300">⚡ {xp} XP</span>
              {combo >= 2 && <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="rounded-full bg-violet-500/15 border border-violet-500/40 px-3 py-1 text-violet-300">🔥 سلسلة ×{combo}</motion.span>}
              <span className="rounded-full bg-white/5 px-3 py-1">{qi + 1}/{QUESTIONS.length}</span>
            </div>
          )}
        </div>

        {/* ===== المقدمة ===== */}
        {phase === 'intro' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-8 text-center">
            <div className="text-5xl">⚡</div>
            <h1 className="mt-2 text-3xl font-extrabold">تحدي السرعة <span className="text-amber-300">والإتقان</span></h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400 leading-7">
              {QUESTIONS.length} آيات • {TIME_PER_Q} ثوانٍ لكل سؤال • انقر الكلمة الصحيحة بالخط العثماني.
              كلما أسرعت زادت مكافأة السرعة (+30)، والسلسلة المتتالية تضاعف نقاطك حتى ×2.
            </p>
            <button onClick={() => setPhase('play')} className="mt-6 rounded-xl bg-amber-400 px-10 py-3.5 text-sm font-extrabold text-black hover:bg-amber-300 shadow-lg shadow-amber-400/25">▶ ابدأ التحدي</button>
          </motion.div>
        )}

        {/* ===== اللعب ===== */}
        {phase === 'play' && (
          <div>
            {/* شريط الوقت */}
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full transition-[width] duration-100 ${timeLeft < 4 ? 'bg-rose-500' : 'bg-gradient-to-l from-amber-300 to-emerald-400'}`}
                style={{ width: `${(timeLeft / TIME_PER_Q) * 100}%` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={q.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                className={`mt-4 rounded-2xl border p-6 md:p-8 text-center ${flash === 'good' ? 'border-emerald-400 bg-emerald-500/10' : flash === 'bad' ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 bg-white/[.04]'}`}>
                <p className="text-sm font-bold text-slate-300">{q.prompt} <span className="text-slate-500">— {q.ref}</span></p>
                <p className="mt-1 text-xs font-bold tabular-nums text-slate-400">{timeLeft.toFixed(1)} ث</p>
                <div className="mt-4 text-4xl md:text-5xl leading-[2.2]" style={{ fontFamily: "'Amiri Quran', serif" }}>
                  {q.words.map((w, i) => (
                    <motion.button key={i} whileTap={{ scale: 0.92 }} onClick={() => pick(w.ok)}
                      className="mx-2 inline-block rounded-xl px-4 py-1 bg-black/30 border border-white/10 hover:border-amber-400/60 hover:bg-amber-400/10 transition">
                      {w.t}
                    </motion.button>
                  ))}
                </div>
                {flash === 'good' && <motion.p initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="mt-2 font-extrabold text-emerald-300">+{earned[earned.length - 1]} XP ✓</motion.p>}
                {flash === 'bad' && <p className="mt-2 font-bold text-rose-300">✗ إجابة خاطئة أو انتهى الوقت</p>}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ===== النتيجة ===== */}
        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-8 text-center">
            <div className="text-5xl">{accuracy >= 0.8 ? '🏆' : accuracy >= 0.5 ? '💪' : '📖'}</div>
            <h2 className="mt-2 text-2xl font-extrabold">{accuracy >= 0.8 ? 'أداء النخبة!' : accuracy >= 0.5 ? 'جيد — واصل!' : 'راجع الشجرة وحاول مجدداً'}</h2>
            <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 p-3"><div className="text-xl font-extrabold text-amber-300">+{xp}</div><div className="text-[11px] text-slate-400">XP (حُفظ في XpEvent)</div></div>
              <div className="rounded-xl bg-black/30 p-3"><div className="text-xl font-extrabold">{correct}/{QUESTIONS.length}</div><div className="text-[11px] text-slate-400">الدقة {Math.round(accuracy * 100)}%</div></div>
              <div className="rounded-xl bg-black/30 p-3"><div className="text-xl font-extrabold text-violet-300">×{maxCombo}</div><div className="text-[11px] text-slate-400">أطول سلسلة</div></div>
            </div>
            <div className="mx-auto mt-4 flex max-w-md gap-2">
              <button onClick={() => { setQi(0); setXp(0); setCombo(0); setMaxCombo(0); setCorrect(0); setEarned([]); setFlash(null); setPhase('play'); }} className="flex-1 rounded-xl bg-amber-400 py-3 text-sm font-extrabold text-black hover:bg-amber-300">↻ إعادة التحدي</button>
              <button onClick={onExit} className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold hover:bg-white/10">عودة</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
