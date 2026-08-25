import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthRequest } from '../middleware/auth';
import { sendFeedback } from '../lib/email';

const router = Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/account/preferences — current notification preferences.
router.get('/preferences', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { data } = await supabaseAdmin
      .from('users')
      .select('email_reminders')
      .eq('id', userId)
      .single();
    // Default to on when the column/row is missing.
    res.json({ email_reminders: data?.email_reminders ?? true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load preferences' });
  }
});

// PATCH /api/account/preferences — update notification preferences.
router.patch('/preferences', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { email_reminders } = req.body || {};
    if (typeof email_reminders !== 'boolean') {
      return res.status(400).json({ error: 'email_reminders (boolean) required' });
    }
    const { error } = await supabaseAdmin
      .from('users')
      .update({ email_reminders })
      .eq('id', userId);
    if (error) throw error;
    res.json({ email_reminders });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update preferences' });
  }
});

// POST /api/account/feedback — user suggestion / idea / bug report, emailed to owner.
router.post('/feedback', async (req: AuthRequest, res) => {
  try {
    const category = String(req.body?.category || 'Feedback').slice(0, 40);
    const message = String(req.body?.message || '').trim();
    if (message.length < 3) return res.status(400).json({ error: 'Message is too short' });
    if (message.length > 5000) return res.status(400).json({ error: 'Message is too long' });
    await sendFeedback(req.userEmail || 'unknown', category, message);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send feedback' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Delete user data — RLS cascades handle shows/services
    await supabaseAdmin.from('shows').delete().eq('user_id', userId);
    await supabaseAdmin.from('services').delete().eq('user_id', userId);

    // Delete the auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete account' });
  }
});

export default router;
