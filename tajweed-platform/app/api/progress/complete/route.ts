// ============================================================
// app/api/progress/complete/route.ts — تحديث العقدة + XP + السلسلة
// يُستدعى من زر "إنهاء الدرس" في LessonPage.tsx
// Prisma models: UserProgress, XpEvent, User (streakDays, xp, lastActiveAt)
// ============================================================
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { userId, nodeId, score } = await req.json(); // score: 0..1 نتيجة الاختبار + التحليل الصوتي
  // 1) جلب العقدة + التقدم الحالي
  const node = await prisma.skillNode.findUnique({ where: { id: nodeId } });
  if (!node) return NextResponse.json({ error: 'node_not_found' }, { status: 404 });

  const prev = await prisma.userProgress.findUnique({
    where: { userId_nodeId: { userId, nodeId } },
  });
  const mastery = Math.max(prev?.mastery ?? 0, score);
  const completed = mastery >= 0.7; // عتبة الإتقان

  // 2) تحديث/إنشاء التقدم + فتح العقد التالية تُحسب عند القراءة (unlockAfter)
  await prisma.userProgress.upsert({
    where: { userId_nodeId: { userId, nodeId } },
    create: { userId, nodeId, mastery, unlocked: true },
    update: { mastery, unlocked: true },
  });

  // 3) منح XP (مرة واحدة عند الإكمال الأول + مكافأة جزئية عند التحسين)
  const alreadyCompleted = (prev?.mastery ?? 0) >= 0.7;
  const xpGain = !alreadyCompleted && completed ? node.xpReward : Math.round(node.xpReward * 0.1 * score);
  if (xpGain > 0) {
    await prisma.xpEvent.create({ data: { userId, amount: xpGain, source: 'lesson', meta: { nodeId, score } } });
    await prisma.user.update({ where: { id: userId }, data: { xp: { increment: xpGain } } });
  }

  // 4) السلسلة اليومية Streak
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = user?.lastActiveAt ? new Date(user.lastActiveAt) : null;
  last?.setHours(0, 0, 0, 0);
  let streakDays = user?.streakDays ?? 0;
  if (!last || last.getTime() < today.getTime()) {
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    streakDays = last?.getTime() === yesterday.getTime() ? streakDays + 1 : 1;
    await prisma.user.update({ where: { id: userId }, data: { streakDays, lastActiveAt: new Date() } });
    if (streakDays > 1) {
      await prisma.xpEvent.create({ data: { userId, amount: 20 * streakDays, source: 'streak_bonus', meta: { streakDays } } });
    }
  }

  return NextResponse.json({ mastery, completed, xpGain, streakDays });
}
