import type { PgBoss } from 'pg-boss';
import { serviceDb } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';
import { trainingReminderTick } from './training-reminder-tick.js';

const QUEUE = 'training-reminder.tick';
// Every 15 minutes — covers the 2h window with 7-minute granularity worst case.
const SCHEDULE = '*/15 * * * *';

export async function runTrainingReminders(boss: PgBoss): Promise<void> {
  await boss.createQueue(QUEUE);
  await boss.work(QUEUE, async () => {
    await trainingReminderTick({ db: serviceDb, enqueue: enqueueSms });
  });
  await boss.schedule(QUEUE, SCHEDULE);
  console.log(`[training-reminders] subscribed; cron=${SCHEDULE}`);
}
