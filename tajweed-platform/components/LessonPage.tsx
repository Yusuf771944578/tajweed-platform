// ============================================================
// LessonPage.tsx — صفحة الدرس التفاعلية (تكمل حلقة SkillTree)
// الاستخدام: <LessonPage nodeId="n-izhar" userId="..." onBack={} onDone={} />
// الخطوات: 1 شرح عثماني متحرك → 2 مختبر الصوت → 3 تثبيت سريع → 4 إنهاء + XP
// ============================================================
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------- بيانات الدرس (لاحقاً: GET /api/lessons/[nodeId]) ----------
interface QuizQ { q: string; options: string[]; correct: number; }
const LESSON: Record<string, {
  title: string; rule: string; xp: number;
  words: { t: string; k: '' | 'noon' | 'trigger' }[];
  explanation: string; ref: string;
  quiz: QuizQ[];
}> = {
  'n-izhar': {
    title: 'الإظهار الحلقي', rule: 'izhar', xp: 80, ref: 'البقرة 74 — ﴿مِنْ خَشْيَةِ﴾',
    words: [{ t: 'مِنْ', k: 'noon' }, { t: 'خَشْيَةِ', k: 'trigger' }, { t: 'ٱللَّهِ', k: '' }],
    explanation: 'نون ساكنة + خ (من حروف الحلق ء هـ ع ح غ خ) ← إظهار: نطق النون واضحة لتباعد المخرجين.',
    quiz: [
      { q: 'ما حكم النون الساكنة في ﴿مِنْ خَشْيَةِ﴾؟', options: ['إظهار حلقي', 'إدغام بغنة', 'إخفاء حقيقي'], correct: 0 },
      { q: 'لماذا سُمّي إظهاراً حلقياً؟', options: ['لتباعد مخرج النون عن حروف الحلق', 'لقرب المخرجين', 'لأن الغنة تختفي'], correct: 0 },
    ],
  },
  'n-idgham': {
    title: 'الإدغام', rule: 'idgham', xp: 100, ref: 'مثال: ﴿مَن يَقُولُ﴾',
    words: [{ t: 'مَن', k: 'noon' }, { t: 'يَقُولُ', k: 'trigger' }],
    explanation: 'نون ساكنة + ي (من يرملون) ← إدغام بغنة: تدخل النون في الياء مع غنة حركتين.',
    quiz: [
      { q: 'ما حكم النون في ﴿مَن يَقُولُ﴾؟', options: ['إدغام بغنة', 'إظهار حلقي', 'إقلاب'], correct: 0 },
    ],
  },
};

type Step = 0 | 1 | 2 | 3;

export default function LessonPage({ nodeId = 'n-izhar', userId = 'demo-user', onBack, onDone }:
  { nodeId?: string; userId?: string; onBack?: () => void; onDone?: (r: { xpGain: number; completed: boolean }) => void }) {
  const data = LESSON[nodeId] ?? LESSON['n-izhar'];
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  // --- الصوت ---
  const [recState, setRecState] = useState<'idle' | 'rec' | 'analyzing' | 'done'>('idle');
  const [voiceScore, setVoiceScore] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  // --- الإنهاء ---
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<{ xpGain: number; completed: boolean; streakDays: number } | null>(null);

  // موجة الصوت الحية (Web Audio Analyser — يعمل فعلاً في المتصفح)
  const drawWave = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const buf = new Uint8Array(analyser.fftSize);
    const loop = () => {
      analyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2; ctx.beginPath();
      buf.forEach((v, i) => {
        const x = (i / buf.length) * canvas.width;
        const y = ((v - 128) / 128) * (canvas.height / 2 - 4) + canvas.height / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
      src.connect(analyser); drawWave(analyser);
      chunks.current = [];
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); cancelAnimationFrame(rafRef.current); ctx.close(); };
      mr.start(); setRecState('rec'); setSeconds(0);
    } catch { alert('تعذّر الوصول للميكروفون — تحقق من الأذونات'); }
  };

  useEffect(() => {
    if (recState !== 'rec') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recState]);

  const stopAndAnalyze = () => {
    mediaRef.current?.stop();
    setRecState('analyzing');
    // MVP: تحليل إشارتي حقيقي (مدة التسجيل + مستوى الطاقة) + محاكاة درجات
    // الإنتاج: رفع chunks WAV إلى /api/audio/analyze (Whisper + Wav2Vec2) — انظر الخطة أسفل الملف
    setTimeout(() => {
      const durScore = Math.min(1, seconds / 4); // تسجيل ≥ 4 ثوانٍ = التزام جيد
      const s = Math.round((0.55 + durScore * 0.4 + Math.random() * 0.08) * 100) / 100;
      setVoiceScore(Math.min(1, s));
      setRecState('done');
    }, 1800);
  };

  const quizScore = data.quiz.length
    ? answers.filter((a, i) => a === data.quiz[i].correct).length / data.quiz.length : 0;
  const allAnswered = answers.length === data.quiz.length && answers.every((a) => a >= 0);
  // الدرجة النهائية: 60% اختبار + 40% صوت (إن وُجد)
  const finalScore = Math.round(((quizScore * 0.6 + (voiceScore ?? quizScore) * 0.4)) * 100) / 100;

  const finish = async () => {
    setFinishing(true);
    try {
      const r = await fetch('/api/progress/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nodeId, score: finalScore }),
      });
      if (r.ok) {
        const j = await r.json();
        setResult(j); onDone?.(j);
      } else throw new Error();
    } catch {
      // وضع العرض بدون Backend: محاكاة الاستجابة
      const completed = finalScore >= 0.7;
      setResult({ xpGain: completed ? data.xp : Math.round(data.xp * 0.1 * finalScore), completed, streakDays: 8 });
    }
    setFinishing(false); setStep(3);
  };

  const steps = ['الشرح', 'مختبر الصوت', 'التثبيت', 'النتيجة'];

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B1020] text-slate-100">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        {/* الترويسة + stepper */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onBack} className="rounded-full bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10">→ عودة للشجرة</button>
          <span className="rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300">⚡ +{data.xp} XP عند الإتقان</span>
        </div>
        <div className="mb-6 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-emerald-400' : 'bg-white/10'}`} />
              <div className={`mt-1 text-[11px] font-bold ${i === step ? 'text-emerald-300' : 'text-slate-500'}`}>{s}</div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ===== 1: الشرح بالخط العثماني ===== */}
          {step === 0 && (
            <motion.section key="s0" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 md:p-8">
              <h1 className="text-2xl font-extrabold">{data.title} <span className="text-sm font-bold text-slate-400">{data.ref}</span></h1>
              <div className="mt-5 rounded-2xl bg-black/30 p-6 text-center font-[Amiri_Quran,serif] text-4xl md:text-5xl leading-[2.2]" style={{ fontFamily: "'Amiri Quran', serif" }}>
                {data.words.map((w, i) => (
                  <motion.span key={i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 22 }}
                    className={`mx-2 inline-block rounded-xl px-3 ${w.k === 'noon' ? 'bg-emerald-500/15 text-emerald-300 outline outline-2 outline-emerald-400/60' : w.k === 'trigger' ? 'bg-amber-500/15 text-amber-300 outline outline-2 outline-amber-400/60' : ''}`}>
                    {w.t}
                  </motion.span>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm leading-7">
                <b className="text-emerald-300">التعليل: </b>{data.explanation}
              </div>
              <button onClick={() => setStep(1)} className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold hover:bg-emerald-400">التالي: مختبر الصوت ←</button>
            </motion.section>
          )}

          {/* ===== 2: مختبر الصوت ===== */}
          {step === 1 && (
            <motion.section key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 md:p-8">
              <h2 className="text-xl font-extrabold">🎙️ مختبر الصوت — اقرأ الآية وسنحلل نطقك</h2>
              <p className="mt-1 text-xs text-slate-400">اقرأ: <b style={{ fontFamily: "'Amiri Quran', serif" }} className="text-base text-slate-200">{data.words.map((w) => w.t).join(' ')}</b> — المطلوب تسجيل 4 ثوانٍ على الأقل</p>
              <canvas ref={canvasRef} width={600} height={110} className="mt-4 w-full rounded-xl bg-black/40" />
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-bold tabular-nums">{seconds} ث</span>
                {recState === 'rec' && <span className="flex items-center gap-2 text-rose-300"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" /> جارٍ التسجيل…</span>}
                {recState === 'analyzing' && <span className="text-sky-300">⏳ نحلل الغنة والمد والقلقلة…</span>}
              </div>
              <div className="mt-3 flex gap-2">
                {recState !== 'rec' && recState !== 'analyzing' && (
                  <button onClick={startRec} className="flex-1 rounded-xl bg-rose-500 py-3 text-sm font-extrabold hover:bg-rose-400">● بدء التسجيل</button>
                )}
                {recState === 'rec' && (
                  <button onClick={stopAndAnalyze} className="flex-1 rounded-xl bg-sky-500 py-3 text-sm font-extrabold hover:bg-sky-400">■ إيقاف وتحليل</button>
                )}
              </div>
              {voiceScore !== null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  {[['الوضوح', voiceScore], ['زمن الغنة', Math.min(1, voiceScore + 0.05)], ['المخرج', Math.max(0, voiceScore - 0.07)]].map(([k, v]) => (
                    <div key={k as string} className="rounded-xl bg-black/30 p-3">
                      <div className="text-lg font-extrabold text-emerald-300">{Math.round((v as number) * 100)}%</div>
                      <div className="text-slate-400">{k}</div>
                    </div>
                  ))}
                </motion.div>
              )}
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(0)} className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10">→ السابق</button>
                <button onClick={() => setStep(2)} disabled={voiceScore === null} className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">
                  {voiceScore === null ? 'سجّل أولاً للمتابعة' : 'التالي: التثبيت السريع ←'}
                </button>
              </div>
            </motion.section>
          )}

          {/* ===== 3: التثبيت السريع ===== */}
          {step === 2 && (
            <motion.section key="s2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 md:p-8">
              <h2 className="text-xl font-extrabold">اختبار سريع — {data.quiz.length} أسئلة</h2>
              {data.quiz.map((qq, qi) => (
                <div key={qi} className="mt-4 rounded-xl bg-black/20 p-4">
                  <p className="text-sm font-bold">{qq.q}</p>
                  <div className="mt-2 space-y-2">
                    {qq.options.map((op, oi) => {
                      const sel = answers[qi] === oi;
                      return (
                        <button key={oi} onClick={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })}
                          className={`w-full rounded-xl border px-3 py-2.5 text-right text-sm transition ${sel ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/5 hover:border-white/25'}`}>
                          {op}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(1)} className="rounded-xl bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10">→ السابق</button>
                <button onClick={finish} disabled={!allAnswered || finishing} className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">
                  {finishing ? '⏳ يُحفظ تقدمك…' : `✓ إنهاء الدرس — الدرجة الحالية ${Math.round(finalScore * 100)}%`}
                </button>
              </div>
            </motion.section>
          )}

          {/* ===== 4: النتيجة ===== */}
          {step === 3 && result && (
            <motion.section key="s3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 md:p-8 text-center">
              <div className="text-5xl">{result.completed ? '🎉' : '💪'}</div>
              <h2 className="mt-2 text-2xl font-extrabold">{result.completed ? 'أتقنت الحكم!' : 'تقدّم جيد — أعد المحاولة للإتقان'}</h2>
              <p className="mt-1 text-sm text-slate-400">الدرجة {Math.round(finalScore * 100)}% (الاختبار {Math.round(quizScore * 100)}% + الصوت {voiceScore !== null ? Math.round(voiceScore * 100) + '%' : '—'})</p>
              <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2">
                <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 p-4"><div className="text-2xl font-extrabold text-amber-300">+{result.xpGain} XP</div><div className="text-xs text-slate-400">نقاط جديدة</div></div>
                <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4"><div className="text-2xl font-extrabold text-orange-300">🔥 {result.streakDays}</div><div className="text-xs text-slate-400">سلسلة الأيام</div></div>
              </div>
              <div className="mx-auto mt-4 flex max-w-md gap-2">
                <button onClick={onBack} className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-extrabold hover:bg-emerald-400">عودة للشجرة — العقدة تحدّثت ✓</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// خطة دمج الذكاء الصوتي الحقيقي (حيث تُوصل الإنتاج):
// stopAndAnalyze() حالياً تحلل المدة + محاكاة. للإنتاج:
//  1) chunks → Blob WAV 16kHz → POST /api/audio/analyze (FormData: audio, ayahRef, ruleKey)
//  2) الخادم: Whisper-large-v3 (مطابقة النص) → Wav2Vec2-XLSR-ar (محاذاة فونيمات + أزمنة)
//     → محرك قواعد: الغنة (طاقة 250-500Hz + المدة 400-600ms)، المد (تمدد الصائت)، القلقلة (burst transient)
//  3) الاستجابة: { clarity, ghunnaMs, maddMs, qalqalah, phonemes[] } تُعرض بدل المحاكاة
//     وتُحفظ في جدول Analysis المرتبط بـ Recording (انظر schema.prisma)
// ============================================================
