// ============================================================
// LiveDuel.tsx — غرفة التنافس المباشر 1v1
// الوضع الافتراضي: محاكاة خصم (bot) بمستوى مهارة قابل للضبط — يعمل فوراً بدون خادم
// للإنتاج: مرّر transport={socketTransport} يطبق نفس الواجهة DuelTransport
// (subscribe/onOpponentAnswer/sendAnswer) عبر Socket.io أو Supabase Realtime
// النتيجة تُحفظ عبر POST /api/duels { action:'finish' } → XpEvent duel_win
// ============================================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DuelTransport {
  sendAnswer(qi: number, ok: boolean, ms: number): void;
  onOpponentAnswer(cb: (qi: number, ok: boolean) => void): () => void;
}

interface Q { prompt: string; ref: string; words: { t: string; ok: boolean }[]; }
const QUESTIONS: Q[] = [
  { prompt: 'انقر كلمة الإظهار', ref: 'البقرة 74', words: [{ t: 'مِنْ', ok: false }, { t: 'خَشْيَةِ', ok: true }] },
  { prompt: 'انقر الحرف المقلقَل', ref: 'الإخلاص 1', words: [{ t: 'قُلْ', ok: true }, { t: 'هُوَ', ok: false }] },
  { prompt: 'انقر كلمة الإخفاء', ref: 'البقرة 3', words: [{ t: 'مِن', ok: false }, { t: 'فَضْلِ', ok: true }] },
  { prompt: 'انقر كلمة الإدغام', ref: 'مثال', words: [{ t: 'مَن', ok: false }, { t: 'يَقُولُ', ok: true }] },
];

const TIME = 10;

// خصم محاكى — يحاكي لاعباً حقيقياً (دقة + سرعة عشوائية)
function useSimulatedOpponent(active: boolean, qi: number, skill = 0.7) {
  const [oppLog, setOppLog] = useState<{ qi: number; ok: boolean }[]>([]);
  useEffect(() => {
    if (!active) return;
    const delay = 2500 + Math.random() * 5500;
    const t = setTimeout(() => {
      setOppLog((l) => [...l, { qi, ok: Math.random() < skill }]);
    }, delay);
    return () => clearTimeout(t);
  }, [active, qi, skill]);
  return oppLog;
}

export default function LiveDuel({ userId = 'me', userName = 'أنت', opponentName = 'منافس', transport, onExit }:
  { userId?: string; userName?: string; opponentName?: string; transport?: DuelTransport; onExit?: () => void }) {
  const [phase, setPhase] = useState<'lobby' | 'live' | 'over'>('lobby');
  const [qi, setQi] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [me, setMe] = useState(0);
  const [opp, setOpp] = useState(0);
  const [oppCount, setOppCount] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const simLog = useSimulatedOpponent(phase === 'live' && !transport, qi);

  // إجابات الخصم (محاكاة أو transport حقيقي)
  useEffect(() => {
    if (transport) {
      const off = transport.onOpponentAnswer((qix, ok) => {
        if (qix === qi && ok) { setOpp((s) => s + 100); setOppCount((c) => c + 1); }
        else if (qix === qi) setOppCount((c) => c + 1);
      });
      return off;
    } else {
      const last = simLog[simLog.length - 1];
      if (last && last.qi === qi && phase === 'live') {
        if (last.ok) setOpp((s) => s + 100);
        setOppCount((c) => c + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simLog.length]);

  useEffect(() => {
    if (phase !== 'live') return;
    setTimeLeft(TIME); setAnswered(false);
    timer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) { clearInterval(timer.current!); advance(); return 0; }
        return Math.round((t - 0.1) * 10) / 10;
      });
    }, 100);
    return () => clearInterval(timer.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qi]);

  const advance = () => {
    if (qi + 1 >= QUESTIONS.length) end();
    else setQi((i) => i + 1);
  };

  const answer = (ok: boolean) => {
    if (answered) return;
    setAnswered(true); clearInterval(timer.current!);
    if (ok) setMe((s) => s + 100);
    transport?.sendAnswer(qi, ok, (TIME - timeLeft) * 1000);
    setTimeout(advance, 600);
  };

  const end = async () => {
    setPhase('over');
    const w = me >= opp ? userName : opponentName;
    setWinner(w);
    try {
      await fetch('/api/duels', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finish', duelId: 'demo-duel', scores: [{ userId, score: me }, { userId: 'opp', score: opp }] }),
      });
    } catch { /* عرض محلي */ }
  };

  const q = QUESTIONS[qi];

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B1020] text-slate-100">
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="mb-4 flex justify-between"><button onClick={onExit} className="rounded-full bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10">→ خروج</button>
          <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-300">● غرفة 1v1 مباشرة {transport ? '(متصل)' : '(خصم محاكى)'}</span></div>

        {phase === 'lobby' && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-8 text-center">
            <div className="flex items-center justify-center gap-6">
              <div><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl font-extrabold text-emerald-300">أ</div><p className="mt-2 text-sm font-bold">{userName}</p></div>
              <div className="text-3xl font-extrabold text-slate-500">VS</div>
              <div><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl font-extrabold text-violet-300">خ</div><p className="mt-2 text-sm font-bold">{opponentName}</p></div>
            </div>
            <p className="mt-4 text-xs text-slate-400">{QUESTIONS.length} جولات • {TIME} ثوانٍ للجولة • الفائز +150 XP والخاسر +40 XP</p>
            <button onClick={() => setPhase('live')} className="mt-5 rounded-xl bg-rose-500 px-10 py-3 text-sm font-extrabold hover:bg-rose-400">⚔️ ابدأ النزال</button>
          </motion.div>
        )}

        {phase === 'live' && (
          <div>
            {/* لوحة النقاط الحية */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
                <div className="text-xs font-bold text-emerald-300">{userName}</div>
                <motion.div key={me} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-2xl font-extrabold">{me}</motion.div>
              </div>
              <div className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-3 text-center">
                <div className="text-xs font-bold text-violet-300">{opponentName}</div>
                <motion.div key={opp} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-2xl font-extrabold">{opp}</motion.div>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-rose-500 transition-all" style={{ width: `${(timeLeft / TIME) * 100}%` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={qi} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
                className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-6 text-center">
                <p className="text-sm font-bold">الجولة {qi + 1}/{QUESTIONS.length} — {q.prompt} <span className="text-slate-500">({q.ref})</span></p>
                <div className="mt-3 text-4xl leading-[2]" style={{ fontFamily: "'Amiri Quran', serif" }}>
                  {q.words.map((w, i) => (
                    <button key={i} onClick={() => answer(w.ok)} disabled={answered}
                      className={`mx-2 inline-block rounded-xl border px-4 py-1 transition ${answered ? 'opacity-60' : 'bg-black/30 border-white/10 hover:border-rose-400/60 hover:bg-rose-500/10'}`}>{w.t}</button>
                  ))}
                </div>
                {oppCount > qi && <p className="mt-2 text-[11px] text-violet-300">الخصم أجاب هذه الجولة…</p>}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {phase === 'over' && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-8 text-center">
            <div className="text-5xl">{winner === userName ? '🏆' : '🤝'}</div>
            <h2 className="mt-2 text-2xl font-extrabold">الفائز: {winner}</h2>
            <p className="text-sm text-slate-400">{me} — {opp} • {winner === userName ? '+150 XP (duel_win)' : '+40 XP مشاركة'}</p>
            <div className="mx-auto mt-4 flex max-w-md gap-2">
              <button onClick={() => { setQi(0); setMe(0); setOpp(0); setOppCount(0); setWinner(null); setPhase('live'); }} className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-extrabold hover:bg-rose-400">↻ نزال جديد</button>
              <button onClick={onExit} className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold hover:bg-white/10">عودة</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
