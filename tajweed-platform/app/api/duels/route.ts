// ============================================================
// app/api/duels/route.ts — غرف التنافس 1v1
// POST { action:'create'|'finish', ... } — MVP عبر REST polling
// الإنتاج: استبدل polling بـ Socket.io / Supabase Realtime (الواجهة جاهزة في LiveDuel.tsx)
// ============================================================
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === 'create') {
    const { hostId, tournamentId, questions } = body;
    const duel = await prisma.duel.create({
      data: {
        mode: '1v1', status: 'live', tournamentId: tournamentId ?? null,
        questions: questions ?? [],
        players: { create: [{ userId: hostId }, { userId: body.guestId }] },
      },
      include: { players: true },
    });
    return NextResponse.json({ duel });
  }

  if (body.action === 'finish') {
    const { duelId, scores } = body as { duelId: string; scores: { userId: string; score: number }[] };
    for (const s of scores) {
      await prisma.duelPlayer.updateMany({ where: { duelId, userId: s.userId }, data: { score: s.score } });
    }
    await prisma.duel.update({ where: { id: duelId }, data: { status: 'finished' } });
    const winner = [...scores].sort((a, b) => b.score - a.score)[0];
    const WIN_XP = 150, LOSE_XP = 40;
    for (const s of scores) {
      const gain = s.userId === winner.userId ? WIN_XP : LOSE_XP;
      await prisma.xpEvent.create({ data: { userId: s.userId, amount: gain, source: s.userId === winner.userId ? 'duel_win' : 'duel_play', meta: { duelId } } });
      await prisma.user.update({ where: { id: s.userId }, data: { xp: { increment: gain } } });
    }
    return NextResponse.json({ winnerId: winner.userId, winXp: WIN_XP, loseXp: LOSE_XP });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
