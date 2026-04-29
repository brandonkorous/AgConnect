import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { waitlistRequestSchema } from './schemas';
import { addToWaitlist } from './service';

export const landingRoutes = new Hono();

landingRoutes.post('/waitlist', zValidator('json', waitlistRequestSchema), async (c) => {
  const body = c.req.valid('json');
  const result = await addToWaitlist(body);
  return c.json(result, 200);
});
