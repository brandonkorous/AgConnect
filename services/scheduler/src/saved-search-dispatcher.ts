import type { PgBoss } from 'pg-boss';
import { serviceDb } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';
import { savedSearchTick } from './saved-search-tick.js';

const QUEUE = 'saved-search.tick';
const SCHEDULE = '*/30 * * * *'; // every 30 minutes

export async function runSavedSearchDispatcher(boss: PgBoss): Promise<void> {
  await boss.createQueue(QUEUE);
  await boss.work(QUEUE, async () => {
    await savedSearchTick({ db: serviceDb, enqueue: enqueueSms });
  });
  await boss.schedule(QUEUE, SCHEDULE);
  console.log(`[saved-search-dispatcher] subscribed; cron=${SCHEDULE}`);
}
