// ============================================================
// app/api/leaderboard/route.ts — لوحة الصدارة (موسم/فصل/عام)
// GET ?seasonId=&classroomId=&limit=20
// يجمع XpEvent داخل فترة الموسم ويرتب المستخدمين
// ============================================================
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');
  const classroomId = searchParams.get('classroomId');
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);

  const season = seasonId ? await prisma.season.findUnique({ where: { id: seasonId } }) : null;
  const from = season?.startsAt ?? new Date(0);
  const to = season?.endsAt ?? new Date();

  let userIds: string[] | undefined;
  if (classroomId) {
    const enr = await prisma.enrollment.findMany({ where: { classroomId }, select: { userId: true } });
    userIds = enr.map((e) => e.userId);
  }

  const events = await prisma.xpEvent.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: from, lte: to }, ...(userIds ? { userId: { in: userIds } } : {}) },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: limit,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: events.map((e) => e.userId) } },
    select: { id: true, name: true, rank: true, streakDays: true },
  });
  const umap = new Map(users.map((u) => [u.id, u]));
  const board = events.map((e, i) => ({ position: i + 1, xp: e._sum.amount ?? 0, user: umap.get(e.userId) }));

  const tournaments = seasonId
    ? await prisma.tournament.findMany({ where: { seasonId }, select: { id: true, titleAr: true } })
    : [];

  return NextResponse.json({ season, board, tournaments });
}
