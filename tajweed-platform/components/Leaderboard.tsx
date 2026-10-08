// ============================================================
// Leaderboard.tsx — لوحة صدارة المواسم والبطولات
// منصة تتويج Top3 + جدول + بطاقة بطولة — GET /api/leaderboard
// ============================================================
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Entry { position: number; xp: number; name: string; rank: string; streak: number; you?: boolean; }

const SEASONS = [
  { id: 's1', title: 'دوري المدارس — رمضان 1448' },
  { id: 's2', title: 'بطولة الحلقات الصيفية' },
];

const BOARD: Record<string, Entry[]> = {
  s1: [
    { position: 1, xp: 4850, name: 'عبدالله م.', rank: 'متمكن', streak: 21 },
    { position: 2, xp: 4620, name: 'يوسف ن.', rank: 'متمكن', streak: 18, you: true },
    { position: 3, xp: 4310, name: 'حمزة س.', rank: 'مجوّد', streak: 15 },
    { position: 4, xp: 3980, name: 'مريم خ.', rank: 'مجوّد', streak: 12 },
    { position: 5, xp: 3540, name: 'أنس ر.', rank: 'مجوّد', streak: 9 },
    { position: 6, xp: 3100, name: 'ليان ع.', rank: 'مبتدئ', streak: 7 },
  ],
  s2: [
    { position: 1, xp: 2100, name: 'يوسف ن.', rank: 'مجوّد', streak: 18, you: true },
    { position: 2, xp: 1950, name: 'سارة ف.', rank: 'مجوّد', streak: 11 },
    { position: 3, xp: 1800, name: 'عمر د.', rank: 'مبتدئ', streak: 8 },
  ],
};

const BRACKET = [
  { round: 'نصف النهائي', a: 'عبدالله م. 300', b: 'حمزة س. 200', done: true },
  { round: 'نصف النهائي', a: 'يوسف ن. 300', b: 'مريم خ. 250', done: true },
  { round: 'النهائي — الجمعة', a: 'عبدالله م.', b: 'يوسف ن.', done: false },
];

export default function Leaderboard() {
  const [season, setSeason] = useState('s1');
  const [tab, setTab] = useState<'global' | 'class'>('global');
  const board = BOARD[season];

  const top3 = board.slice(0, 3);
  const rest = board.slice(3);
  const order = [top3[1], top3[0], top3[2]]; // منصة: الثاني-الأول-الثالث

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B1020] text-slate-100">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <h1 className="text-2xl font-extrabold">المواسم <span className="text-amber-300">والبطولات</span></h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button key={s.id} onClick={() => setSeason(s.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${season === s.id ? 'bg-amber-400 text-black' : 'bg-white/5 hover:bg-white/10'}`}>{s.title}</button>
          ))}
          <div className="mr-auto flex gap-1 rounded-full bg-white/5 p-1 text-xs font-bold">
            <button onClick={() => setTab('global')} className={`rounded-full px-4 py-1.5 ${tab === 'global' ? 'bg-white/15' : ''}`}>العام</button>
            <button onClick={() => setTab('class')} className={`rounded-full px-4 py-1.5 ${tab === 'class' ? 'bg-white/15' : ''}`}>فصلي</button>
          </div>
        </div>

        {/* منصة التتويج */}
        <div className="mt-6 flex items-end justify-center gap-3">
          {order.filter(Boolean).map((e, i) => {
            const first = e!.position === 1;
            return (
              <motion.div key={e!.position} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`w-28 rounded-2xl border p-3 text-center ${first ? 'border-amber-300/60 bg-amber-400/10 pb-6' : 'border-white/10 bg-white/[.04]'} ${e!.you ? 'ring-2 ring-emerald-400' : ''}`}>
                <div className="text-2xl">{e!.position === 1 ? '🥇' : e!.position === 2 ? '🥈' : '🥉'}</div>
                <div className="mt-1 truncate text-sm font-extrabold">{e!.name}</div>
                <div className="text-[11px] text-slate-400">{e!.rank} • 🔥{e!.streak}</div>
                <div className="mt-1 font-extrabold text-amber-300">{e!.xp} XP</div>
              </motion.div>
            );
          })}
        </div>

        {/* الجدول */}
        <div className="mt-4 space-y-2">
          {rest.map((e) => (
            <motion.div key={e.position} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`flex items-center gap-3 rounded-xl border p-3 ${e.you ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-white/10 bg-white/[.03]'}`}>
              <span className="w-8 text-center font-extrabold text-slate-400">#{e.position}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 font-extrabold">{e.name[0]}</div>
              <div className="flex-1"><div className="text-sm font-bold">{e.name} {e.you && <span className="text-emerald-300">(أنت)</span>}</div>
                <div className="text-[11px] text-slate-400">{e.rank} • سلسلة {e.streak} يوم</div></div>
              <span className="font-extrabold text-amber-300">{e.xp} XP</span>
            </motion.div>
          ))}
        </div>
        {tab === 'class' && <p className="mt-2 text-center text-[11px] text-slate-500">وضع الفصل: يُصفّى عبر classroomId — GET /api/leaderboard?classroomId=… (يعرض نفس التصميم ببيانات الفصل)</p>}

        {/* قوس البطولة */}
        <h2 className="mt-8 text-lg font-extrabold">🏟️ قوس البطولة — {SEASONS.find((s) => s.id === season)!.title}</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {BRACKET.map((m, i) => (
            <div key={i} className={`rounded-2xl border p-4 text-sm ${m.done ? 'border-white/10 bg-white/[.03]' : 'border-amber-300/50 bg-amber-400/5'}`}>
              <div className="text-[11px] font-bold text-slate-400">{m.round}</div>
              <div className="mt-2 font-bold">{m.a}</div>
              <div className="text-center text-slate-500">ضد</div>
              <div className="font-bold">{m.b}</div>
              <div className={`mt-2 text-center text-[11px] font-bold ${m.done ? 'text-slate-500' : 'text-amber-300'}`}>{m.done ? 'انتهت' : '● قادمة'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
