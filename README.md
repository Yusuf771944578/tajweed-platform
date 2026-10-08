# منصة التجويد التفاعلية | Tajweed Gamified Platform

منصة تعليم أحكام التجويد والقرآن الكريم بأسلوب التعلم باللعب (Gamification) للمراحل الإعدادية والثانوية والجامعية.

## العروض الحية (Static Demos — تعمل مباشرة على Netlify)

| العرض | الملف |
|---|---|
| البوابة الرئيسية | `tajweed-platform/index.html` |
| استوديو المعلم التفاعلي | `tajweed-platform/demo-teacher-studio.html` |
| شجرة الأحكام | `tajweed-platform/demo-skill-tree.html` |
| صفحة الدرس + مختبر الصوت | `tajweed-platform/demo-lesson.html` |
| تحدي السرعة والإتقان | `tajweed-platform/demo-time-attack.html` |
| النزال المباشر 1v1 | `tajweed-platform/demo-duel.html` |
| المواسم والصدارة | `tajweed-platform/demo-leaderboard.html` |

## كود الإنتاج (Next.js + Prisma)

```
tajweed-platform/
├── components/
│   ├── TeacherStudio.tsx   # السبورة العثمانية المتحركة
│   ├── SkillTree.tsx       # شجرة الأحكام Gamified
│   ├── LessonPage.tsx      # الدرس: شرح + صوت + اختبار + XP
│   ├── TimeAttackBlitz.tsx # تحدي السرعة المؤقت
│   ├── LiveDuel.tsx        # غرفة 1v1 (محاكاة + واجهة Socket جاهزة)
│   └── Leaderboard.tsx     # الصدارة والمواسم
├── prisma/schema.prisma    # قاعدة البيانات الكاملة (PostgreSQL)
└── app/api/
    ├── progress/complete/route.ts  # إنهاء الدرس → XP + Streak
    ├── xp/time-attack/route.ts     # احتساب XP تحدي السرعة + الرتب
    ├── duels/route.ts              # إنشاء/إنهاء النزالات
    └── leaderboard/route.ts        # تجميع الصدارة حسب الموسم
```

## التقنيات

Next.js 14 + TypeScript + Tailwind CSS + Framer Motion + PostgreSQL + Prisma + Redis + Whisper + Wav2Vec2-XLSR-ar

## ملاحظة هندسية

النص العثماني يُعرض كنص Unicode (Tanzil Uthmani) والتظليل على مستوى **الكلمة** حفاظاً على اتصال الحروف العربية ورسم المصحف.
