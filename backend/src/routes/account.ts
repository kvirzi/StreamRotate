import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
