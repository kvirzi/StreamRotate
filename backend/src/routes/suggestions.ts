import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { AuthRequest } from '../middleware/auth';
import { createUserClient } from '../lib/supabase';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Suggestion {
  title: string;
  why: string;
  service: string;
  genre: string;
}

async function getUserShowsContext(userId: string, accessToken: string): Promise<string> {
  const client = createUserClient(accessToken);
  const { data: shows } = await client
    .from('shows')
    .select('title, status, services(name)')
    .eq('user_id', userId);

  const { data: services } = await client
    .from('services')
    .select('name')
    .eq('user_id', userId)
    .eq('active', true);

  const showList = (shows || [])
    .map((s: { title: any; status: any; services: any }) =>
      `${s.title} (${s.status}) on ${(Array.isArray(s.services) ? s.services[0]?.name : s.services?.name) || 'unknown'}`
    )
    .join(', ');

  const serviceList = (services || []).map((s: { name: string }) => s.name).join(', ');

  return `User's streaming services: ${serviceList || 'none'}. Current watchlist: ${showList || 'empty'}.`;
}

// POST /api/suggestions
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const context = await getUserShowsContext(req.userId!, req.accessToken!);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${context}

Based on this user's streaming services and current watchlist, suggest 6 TV shows they might enjoy. Consider variety in genre and service. Do NOT suggest shows already in their watchlist.

Return ONLY a JSON array with exactly 6 objects, no other text:
[{"title": "Show Name", "why": "Brief reason why they'd like it (1-2 sentences)", "service": "Streaming Service Name", "genre": "Genre"}]`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      res.status(500).json({ error: 'Unexpected response from AI' });
      return;
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      res.status(500).json({ error: 'Could not parse AI response' });
      return;
    }

    const suggestions: Suggestion[] = JSON.parse(jsonMatch[0]);
    res.json(suggestions);
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// POST /api/suggestions/replace
router.post('/replace', async (req: AuthRequest, res: Response): Promise<void> => {
  const { existing, index } = req.body;

  if (!Array.isArray(existing) || typeof index !== 'number') {
    res.status(400).json({ error: 'existing (array) and index (number) are required' });
    return;
  }

  try {
    const context = await getUserShowsContext(req.userId!, req.accessToken!);
    const existingTitles = existing.map((s: Suggestion) => s.title).join(', ');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `${context}

I already have these suggestions: ${existingTitles}

Suggest 1 NEW TV show different from all of the above and the user's existing watchlist.

Return ONLY a JSON object, no other text:
{"title": "Show Name", "why": "Brief reason why they'd like it (1-2 sentences)", "service": "Streaming Service Name", "genre": "Genre"}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      res.status(500).json({ error: 'Unexpected response from AI' });
      return;
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: 'Could not parse AI response' });
      return;
    }

    const suggestion: Suggestion = JSON.parse(jsonMatch[0]);
    res.json({ suggestion, index });
  } catch (err) {
    console.error('Replace suggestion error:', err);
    res.status(500).json({ error: 'Failed to generate suggestion' });
  }
});

export default router;
