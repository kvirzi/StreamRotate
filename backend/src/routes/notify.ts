import { Router, Request, Response } from 'express';
import { notifyNewSignup } from '../lib/email';

const router = Router();

// POST /api/notify/signup — called by Supabase Auth webhook on new user INSERT
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  // Verify the shared secret so random people can't spam this endpoint
  const secret = req.headers['x-webhook-secret'];
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Supabase sends the new user record in req.body.record
    const email = req.body?.record?.email || req.body?.email || 'unknown';
    await notifyNewSignup(email);
    res.json({ ok: true });
  } catch (err) {
    console.error('Signup notification error:', err);
    res.status(500).json({ error: 'Notification failed' });
  }
});

export default router;
