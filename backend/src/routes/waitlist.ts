import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// POST /api/waitlist
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Duplicate email — still treat as success
      res.json({ message: 'You are already on the waitlist!' });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ message: 'Successfully added to waitlist!' });
});

export default router;
