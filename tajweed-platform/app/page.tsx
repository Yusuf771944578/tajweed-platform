// الصفحة الرئيسية لنسخة الإنتاج (Next.js) — تنقّل بين الوحدات الست
// النشر: Vercel + قاعدة Neon/Supabase عبر DATABASE_URL (انظر .env.example)
'use client';

import { useState } from 'react';
import SkillTree from '../components/SkillTree';
import LessonPage from '../components/LessonPage';
import TeacherStudio from '../components/TeacherStudio';
import TimeAttackBlitz from '../components/TimeAttackBlitz';
import LiveDuel from '../components/LiveDuel';
import Leaderboard from '../components/Leaderboard';

type View = 'tree' | 'lesson' | 'studio' | 'blitz' | 'duel' | 'board';

const TABS: { id: View; label: string }[] = [
  { id: 'tree', label: '🌳 الشجرة' },
  { id: 'studio', label: '🖥️ الاستوديو' },
  { id: 'blitz', label: '⚡ السرعة' },
  { id: 'duel', label: '⚔️ النزال' },
  { id: 'board', label: '🏆 الصدارة' },
];

export default function Page() {
  const [view, setView] = useState<View>('tree');
  const [nodeId, setNodeId] = useState('n-izhar');

  return (
    <div>
      <nav dir="rtl" className="sticky top-0 z-50 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#0B1020]/95 p-3 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${
              view === t.id || (t.id === 'tree' && view === 'lesson')
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {view === 'tree' && (
        <SkillTree
          onStart={(id) => {
            setNodeId(id);
            setView('lesson');
          }}
        />
      )}
      {view === 'lesson' && <LessonPage nodeId={nodeId} onBack={() => setView('tree')} onDone={() => setView('tree')} />}
      {view === 'studio' && <TeacherStudio />}
      {view === 'blitz' && <TimeAttackBlitz onExit={() => setView('tree')} />}
      {view === 'duel' && <LiveDuel onExit={() => setView('tree')} />}
      {view === 'board' && <Leaderboard />}
    </div>
  );
}
