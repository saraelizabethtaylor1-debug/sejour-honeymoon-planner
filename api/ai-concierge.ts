import type { VercelRequest, VercelResponse } from '@vercel/node';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, corsHeaders);
    return res.json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body as { prompt?: string };

  if (!prompt || typeof prompt !== 'string') {
    res.writeHead(400, corsHeaders);
    return res.json({ error: 'prompt field is required and must be a string' });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    res.writeHead(500, corsHeaders);
    return res.json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await anthropicRes.json();

  res.writeHead(anthropicRes.status, { ...corsHeaders, 'Content-Type': 'application/json' });
  return res.end(JSON.stringify(data));
}
