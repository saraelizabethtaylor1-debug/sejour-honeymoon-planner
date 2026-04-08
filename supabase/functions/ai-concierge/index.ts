import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error('[ai-concierge] Failed to parse request body:', parseErr);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[ai-concierge] Request body keys:', Object.keys(body as object));

    const { prompt } = body as { prompt?: string };

    if (!prompt || typeof prompt !== 'string') {
      console.error('[ai-concierge] Missing or invalid prompt field. Received:', JSON.stringify(body));
      return new Response(
        JSON.stringify({ error: 'prompt field is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[ai-concierge] prompt length:', prompt.length);

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      console.error('[ai-concierge] ANTHROPIC_API_KEY secret is not set');
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[ai-concierge] Calling Anthropic API...');

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
    console.log('[ai-concierge] Anthropic status:', anthropicRes.status);

    if (!anthropicRes.ok) {
      console.error('[ai-concierge] Anthropic error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data.error?.message ?? 'Anthropic API error', detail: data }),
        { status: anthropicRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[ai-concierge] Success, stop_reason:', data.stop_reason);

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[ai-concierge] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
