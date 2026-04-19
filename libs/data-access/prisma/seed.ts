/* eslint-disable no-console */
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildRruleString } from '../../utils/src/rrule.utils';

const prisma = new PrismaClient();

const SEED_EMAIL = process.env.SEED_USER_EMAIL ?? 'demo@planning.app';
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'demo1234';

async function main(): Promise<void> {
  console.log(`Seeding demo data for ${SEED_EMAIL}…`);

  // Hard reset for idempotent seeds (dev-only).
  await prisma.taskException.deleteMany();
  await prisma.recurrenceRule.deleteMany();
  await prisma.task.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: SEED_EMAIL } });

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      email: SEED_EMAIL,
      passwordHash,
      displayName: 'Demo User',
      timezone: 'Europe/Paris',
    },
  });

  const today = startOfUtcDay(new Date());
  const in2Days = addDays(today, 2);

  // 1. One-shot task due in 2 days.
  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Review Q2 roadmap',
      description: 'Align priorities with the product team.',
      dueDate: at(in2Days, 14, 0),
      priority: 'HIGH',
      status: 'TODO',
      tags: ['work', 'planning'],
    },
  });

  // 2. Daily stand-up, every weekday at 09:30 (using WEEKLY BYDAY for weekdays).
  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Daily stand-up',
      description: '15-minute team sync.',
      dueDate: at(today, 9, 30),
      priority: 'MEDIUM',
      status: 'TODO',
      tags: ['work', 'meeting'],
      recurrence: {
        create: buildRule({
          freq: 'WEEKLY',
          byWeekday: [0, 1, 2, 3, 4],
          startsOn: at(today, 9, 30),
        }),
      },
    },
  });

  // 3. Weekly gym session, Tue + Thu + Sat at 18:00.
  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Gym',
      description: 'Strength training.',
      dueDate: at(today, 18, 0),
      priority: 'LOW',
      status: 'TODO',
      tags: ['health'],
      recurrence: {
        create: buildRule({
          freq: 'WEEKLY',
          byWeekday: [1, 3, 5],
          startsOn: at(today, 18, 0),
        }),
      },
    },
  });

  // 4. Monthly: pay rent on the 1st.
  const firstOfThisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 9, 0));
  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Pay rent',
      dueDate: firstOfThisMonth,
      priority: 'URGENT',
      status: 'TODO',
      tags: ['finance'],
      recurrence: {
        create: buildRule({
          freq: 'MONTHLY',
          byMonthDay: [1],
          startsOn: firstOfThisMonth,
        }),
      },
    },
  });

  // 5. Recurring task with a SKIP exception and a MODIFY exception to demo
  //    the "edit one occurrence" flow.
  const demoRecurring = await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Yoga class',
      dueDate: at(today, 19, 0),
      priority: 'MEDIUM',
      status: 'TODO',
      tags: ['health'],
      recurrence: {
        create: buildRule({
          freq: 'WEEKLY',
          byWeekday: [2],
          startsOn: at(today, 19, 0),
        }),
      },
    },
  });

  const nextWed = nextOccurrenceOfWeekday(today, /* isoMonIndex */ 2);
  const weekAfter = addDays(nextWed, 7);

  await prisma.taskException.create({
    data: {
      taskId: demoRecurring.id,
      originalDate: at(nextWed, 19, 0),
      action: 'SKIP',
    },
  });
  await prisma.taskException.create({
    data: {
      taskId: demoRecurring.id,
      originalDate: at(weekAfter, 19, 0),
      action: 'MODIFY',
      title: 'Yoga class (masterclass)',
      dueDate: at(weekAfter, 20, 0),
    },
  });

  console.log(`✓ Created user ${user.email}`);
  console.log(`  password: ${SEED_PASSWORD}`);
  console.log(`  tasks: 5 (2 one-shot + 3 recurring with 2 exceptions)`);
}

// ─── helpers ─────────────────────────────────────────────────────────────

function startOfUtcDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
}

function at(d: Date, h: number, m: number): Date {
  const out = new Date(d);
  out.setUTCHours(h, m, 0, 0);
  return out;
}

/** 0=Mon..6=Sun (ISO). */
function nextOccurrenceOfWeekday(from: Date, isoMonIndex: number): Date {
  // JS getUTCDay: 0=Sun..6=Sat. Convert to ISO: 0=Mon..6=Sun.
  const jsDay = from.getUTCDay();
  const isoDay = (jsDay + 6) % 7;
  const diff = (isoMonIndex - isoDay + 7) % 7 || 7;
  return addDays(from, diff);
}

function buildRule(input: {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval?: number;
  byWeekday?: number[];
  byMonthDay?: number[];
  startsOn: Date;
  endsOn?: Date | null;
  count?: number | null;
}): Prisma.RecurrenceRuleCreateWithoutTaskInput {
  return {
    freq: input.freq,
    interval: input.interval ?? 1,
    byWeekday: input.byWeekday ?? [],
    byMonthDay: input.byMonthDay ?? [],
    startsOn: input.startsOn,
    endsOn: input.endsOn ?? null,
    count: input.count ?? null,
    rruleString: buildRruleString({
      freq: input.freq,
      interval: input.interval,
      byWeekday: input.byWeekday,
      byMonthDay: input.byMonthDay,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      count: input.count,
    }),
  };
}

main()
  .catch((err) => {
    console.error('Seed failed', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
