/**
 * Seed script — reproduces the exact demo data set from the prototype
 * (reference/Harbour Desk_ MVP prototype.html, `boats` / `docs` / `S.set`).
 *
 * Run:  npm run db:seed      (from server/)
 * Idempotent: re-running replaces this user's boats, documents, reminders and settings.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_PHONE = '+91 98450 11223'; // prefilled in the prototype welcome screen (render())

const DAY = 86_400_000;
const todayUtc = (): Date => {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  return t;
};
const dateAtOffset = (off: number): Date => new Date(todayUtc().getTime() + off * DAY);
const daysLeftFor = (d: Date): number => Math.round((d.getTime() - todayUtc().getTime()) / DAY);

const BOATS = [
  { name: 'Sea Falcon', reg: 'KA-MNG-0412', owner: 'Ravi Naik', kind: 'Fishing trawler', icon: '🎣', color: 's' },
  { name: 'Blue Pearl', reg: 'KA-MNG-0877', owner: 'Ravi Naik', kind: 'Fishing boat', icon: '🐟', color: 'g' },
  { name: 'Santa Maria', reg: 'GA-PNJ-0231', owner: 'Anita D’Souza', kind: 'Cargo dhow', icon: '⚓', color: 'l' },
  { name: 'Wave Rider', reg: 'KA-KWR-1120', owner: 'Coastal Charters', kind: 'Charter boat', icon: '⛵', color: 'a' },
  { name: 'Harbour Queen', reg: 'KA-KWR-1203', owner: 'Coastal Charters', kind: 'Ferry', icon: '🚢', color: 'r' },
] as const;

/** [boat index, document type, days from today, submitted] — straight from the prototype `docs` array */
const DOCS: Array<[number, string, number, boolean]> = [
  [0, 'Registration certificate', 416, true],
  [0, 'Insurance', 47, false],
  [0, 'Survey certificate', -6, false],
  [1, 'Fishing licence', 44, false],
  [1, 'Registration certificate', 300, true],
  [2, 'Crew licence', 28, false],
  [2, 'Insurance', 75, true],
  [3, 'Passenger licence', 58, false],
  [3, 'Insurance', 12, false],
  [4, 'Fire safety certificate', 23, true],
  [4, 'Survey certificate', 81, false],
];

const THRESHOLDS = [60, 30, 14, 7] as const;

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { phone: DEMO_PHONE },
    update: { name: 'Ravi Naik', role: 'Admin', initials: 'RN' },
    create: { phone: DEMO_PHONE, name: 'Ravi Naik', role: 'Admin', initials: 'RN' },
  });

  // Reset this user's data so the seed is repeatable.
  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { userId: user.id } }),
    prisma.document.deleteMany({ where: { userId: user.id } }),
    prisma.boat.deleteMany({ where: { userId: user.id } }),
    prisma.settings.deleteMany({ where: { userId: user.id } }),
  ]);

  // Sequential on purpose: concurrent inserts would let Postgres assign ids in
  // completion order, and `sort=boat` orders by boat id (prototype sorts by `a.b`).
  const boats = [];
  for (const b of BOATS) {
    boats.push(await prisma.boat.create({ data: { userId: user.id, ...b } }));
  }

  for (const [boatIdx, type, off, submitted] of DOCS) {
    const expiryDate = dateAtOffset(off);
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        boatId: boats[boatIdx].id,
        type,
        expiryDate,
        submitted,
      },
    });

    // Reminder rows exactly as V.rem() derives them: non-submitted documents only,
    // enabled thresholds only (all four are on by default), and only when
    // daysLeft - threshold > -90.
    if (submitted) continue;
    for (const k of THRESHOLDS) {
      if (daysLeftFor(expiryDate) - k <= -90) continue;
      await prisma.reminder.create({
        data: {
          userId: user.id,
          documentId: doc.id,
          daysThreshold: k,
          triggerDate: dateAtOffset(off - k),
        },
      });
    }
  }

  await prisma.settings.create({
    data: {
      userId: user.id,
      schedule60: true,
      schedule30: true,
      schedule14: true,
      schedule7: true,
      channelPush: true,
      channelEmail: true,
      channelSms: false, // prototype default: sms:0
    },
  });

  const [boatCount, docCount, reminderCount] = await Promise.all([
    prisma.boat.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { userId: user.id } }),
    prisma.reminder.count({ where: { userId: user.id } }),
  ]);
  console.log(`Seeded ${boatCount} boats, ${docCount} documents, ${reminderCount} reminders for ${user.phone}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
