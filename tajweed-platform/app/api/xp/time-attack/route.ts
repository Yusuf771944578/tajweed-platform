// ============================================================
// app/api/xp/time-attack/route.ts — احتساب XP تحدي السرعة
// Body: { userId, xp, accuracy, maxCombo, correct, total }
// يكتب XpEvent(source='time_attack') ويحدّث رصيد User.xp
// ============================================================
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { userId, xp, accuracy, maxCombo, correct, total } = await req.json();
  if (!userId || typeof xp !== 'number' || xp < 0 || xp > 2000) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  await prisma.xpEvent.create({
    data: { userId, amount: Math.round(xp), source: 'time_attack', meta: { accuracy, maxCombo, correct, total } },
  });
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: Math.round(xp) } },
    select: { xp: true, rank: true },
  });
  // ترقية الرتبة تلقائياً (عتبات شبابية)
  const rank = user.xp >= 5000 ? 'MUQRI' : user.xp >= 2000 ? 'MOTAMAKKEN' : user.xp >= 500 ? 'MOJAWWID' : 'MOBTADE2';
  if (rank !== user.rank) await prisma.user.update({ where: { id: userId }, data: { rank: rank as never } });
  return NextResponse.json({ totalXp: user.xp, rank });
}
