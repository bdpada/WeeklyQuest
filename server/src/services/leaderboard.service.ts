import type { UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';
import { prisma } from '../utils/prismaClient.js';

type CurrentUser = { id: string; role: UserRole };

type LeaderboardUser = { id: string; displayName: string; email: string };

function withCompetitionRanks<T extends { totalScore: number }>(rows: T[]) {
  let lastScore: number | null = null;
  let lastRank = 0;

  return rows.map((row, index) => {
    if (row.totalScore !== lastScore) {
      lastRank = index + 1;
      lastScore = row.totalScore;
    }

    return { rank: lastRank, ...row };
  });
}

async function canAccessGroup(groupId: string, user: CurrentUser) {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      ...(user.role === 'ADMIN' ? {} : { memberships: { some: { userId: user.id } } }),
    },
  });
  if (!group) throw new HttpError(404, 'Group not found');
  return group;
}

function safeUser(user: { id: string; email: string; name: string | null }): LeaderboardUser {
  return { id: user.id, email: user.email, displayName: user.name ?? user.email };
}

export async function getQuestionSetLeaderboard(questionSetId: string, user: CurrentUser) {
  const questionSet = await prisma.questionSet.findUnique({ where: { id: questionSetId } });
  if (!questionSet) throw new HttpError(404, 'Question set not found');

  await canAccessGroup(questionSet.groupId, user);

  if (questionSet.status !== 'SCORED') throw new HttpError(409, 'Question set is not scored');

  const submissions = await prisma.submission.findMany({
    where: { questionSetId, status: 'GRADED' },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: [{ totalScore: 'desc' }, { gradedAt: 'asc' }, { submittedAt: 'asc' }],
  });

  const rows = submissions.map((submission) => ({
    user: safeUser(submission.user),
    submissionId: submission.id,
    totalScore: submission.totalScore,
    submittedAt: submission.submittedAt,
    gradedAt: submission.gradedAt,
  }));

  return withCompetitionRanks(rows);
}

export async function getGroupLeaderboard(groupId: string, user: CurrentUser) {
  await canAccessGroup(groupId, user);

  const submissions = await prisma.submission.findMany({
    where: { status: 'GRADED', questionSet: { groupId, status: 'SCORED' } },
    include: { user: { select: { id: true, email: true, name: true } }, questionSet: { select: { id: true } } },
  });

  const aggregate = new Map<string, {
    user: LeaderboardUser;
    totalScore: number;
    questionSetIds: Set<string>;
    lastScoredAt: Date | null;
  }>();

  for (const submission of submissions) {
    const existing = aggregate.get(submission.userId) ?? {
      user: safeUser(submission.user),
      totalScore: 0,
      questionSetIds: new Set<string>(),
      lastScoredAt: null,
    };
    existing.totalScore += submission.totalScore;
    existing.questionSetIds.add(submission.questionSet.id);
    if (submission.gradedAt && (!existing.lastScoredAt || submission.gradedAt > existing.lastScoredAt)) {
      existing.lastScoredAt = submission.gradedAt;
    }
    aggregate.set(submission.userId, existing);
  }

  const sorted = Array.from(aggregate.values())
    .map((entry) => ({
      user: entry.user,
      totalScore: entry.totalScore,
      completedQuestionSets: entry.questionSetIds.size,
      lastScoredAt: entry.lastScoredAt,
    }))
    .sort((a, b) => b.totalScore - a.totalScore || (a.user.displayName.localeCompare(b.user.displayName)));

  return withCompetitionRanks(sorted);
}

export async function getMyScoreHistory(user: CurrentUser) {
  const submissions = await prisma.submission.findMany({
    where: { userId: user.id, status: 'GRADED', questionSet: { status: 'SCORED' } },
    include: {
      questionSet: {
        select: {
          id: true,
          title: true,
          dueAt: true,
          group: { select: { id: true, name: true } },
          questions: { select: { points: true } },
        },
      },
    },
    orderBy: [{ gradedAt: 'desc' }, { updatedAt: 'desc' }],
  });

  return submissions.map((submission) => ({
    submissionId: submission.id,
    questionSetId: submission.questionSet.id,
    questionSetTitle: submission.questionSet.title,
    groupId: submission.questionSet.group.id,
    groupName: submission.questionSet.group.name,
    totalScore: submission.totalScore,
    maxScore: submission.questionSet.questions.reduce((sum, question) => sum + question.points, 0),
    gradedAt: submission.gradedAt,
    dueAt: submission.questionSet.dueAt,
  }));
}
