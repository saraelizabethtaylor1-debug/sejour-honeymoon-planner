import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query');

    if (!query || !query.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const cx = Deno.env.get('GOOGLE_SEARCH_CX');

    if (!apiKey || !cx) {
      console.error('[image-search] Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX secret');
      return new Response(
        JSON.stringify({ error: 'Search service is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&searchType=image&num=9&q=${encodeURIComponent(query)}`;
    const googleRes = await fetch(searchUrl);
    const data = await googleRes.json();

    if (!googleRes.ok) {
      console.error('[image-search] Google API error:', data);
      return new Response(
        JSON.stringify({ error: data?.error?.message || 'Google search failed' }),
        { status: googleRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[image-search] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
