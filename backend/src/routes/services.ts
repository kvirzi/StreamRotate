import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createUserClient } from '../lib/supabase';

const router = Router();

// GET /api/services
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = createUserClient(req.accessToken!);
  const { data, error } = await client
    .from('services')
    .select('*')
    .eq('user_id', req.userId)
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// POST /api/services
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, cost_monthly, billing_date, is_free, cancel_url } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Service name is required' });
    return;
  }

  const client = createUserClient(req.accessToken!);
  const { data, error } = await client
    .from('services')
    .insert({
      user_id: req.userId,
      name,
      cost_monthly: cost_monthly || 0,
      billing_date: billing_date || null,
      is_free: is_free || false,
      cancel_url: cancel_url || null,
      active: true,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

// PUT /api/services/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, cost_monthly, billing_date, is_free, cancel_url, active } = req.body;

  const client = createUserClient(req.accessToken!);
  const { data, error } = await client
    .from('services')
    .update({
      ...(name !== undefined && { name }),
      ...(cost_monthly !== undefined && { cost_monthly }),
      ...(billing_date !== undefined && { billing_date }),
      ...(is_free !== undefined && { is_free }),
      ...(cancel_url !== undefined && { cancel_url }),
      ...(active !== undefined && { active }),
    })
    .eq('id', id)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }
  res.json(data);
});

// DELETE /api/services/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = createUserClient(req.accessToken!);
  const { error } = await client
    .from('services')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});

export default router;
