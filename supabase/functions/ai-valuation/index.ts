// AI-powered valuation lookups for vehicles, real estate, and personal property.
// Uses Lovable AI Gateway with strict JSON response_format to ensure parseable output.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type ValuationKind = 'vehicle' | 'real_estate' | 'personal_property';

interface VehiclePayload {
  kind: 'vehicle';
  year: string | number;
  make: string;
  model: string;
  trim?: string;
  mileage: string | number;
  condition?: string;
}
interface RealEstatePayload {
  kind: 'real_estate';
  property_type?: string;
  address: string;
  year_built?: string | number;
  square_feet?: string | number;
}
interface PersonalPropertyPayload {
  kind: 'personal_property';
  item_name: string;
  category?: string;
  brand?: string;
  model?: string;
  condition?: string;
}

type Payload = VehiclePayload | RealEstatePayload | PersonalPropertyPayload;

const buildPrompt = (p: Payload): { user: string; schemaHint: string } => {
  if (p.kind === 'vehicle') {
    const condition = p.condition || 'good';
    return {
      user: `What is the current US market value of a ${p.year} ${p.make} ${p.model}${p.trim ? ' ' + p.trim : ''} with approximately ${p.mileage} miles in ${condition} condition? Provide private party value, trade-in value, and dealer retail value in USD.

Return ONLY valid JSON matching this shape, no markdown, no commentary:
{ "private_party": number, "trade_in": number, "dealer_retail": number, "source": string, "as_of_date": string }

The "source" should describe the basis (e.g. "KBB-style estimate based on typical market data"). The "as_of_date" should be today's date in YYYY-MM-DD format. All monetary values must be plain numbers (no $ or commas).`,
      schemaHint: 'private_party, trade_in, dealer_retail',
    };
  }
  if (p.kind === 'real_estate') {
    return {
      user: `What is the current estimated US market value of a ${p.property_type || 'residential'} property at ${p.address}${p.year_built ? `, built in ${p.year_built}` : ''}${p.square_feet ? `, approximately ${p.square_feet} square feet` : ''}? Provide current estimated value, low and high range from comparable sales, and price per square foot if available.

Return ONLY valid JSON matching this shape, no markdown, no commentary:
{ "estimated_value": number, "low_estimate": number, "high_estimate": number, "price_per_sqft": number, "source": string, "as_of_date": string }

The "source" should describe the basis (e.g. "Based on Zillow/Redfin-style comparable sales data"). The "as_of_date" should be today's date in YYYY-MM-DD format. All monetary values must be plain numbers (no $ or commas). If price_per_sqft cannot be reasonably estimated, use 0.`,
      schemaHint: 'estimated_value, low_estimate, high_estimate, price_per_sqft',
    };
  }
  // personal_property
  return {
    user: `What is the current US market value of a ${p.brand ? p.brand + ' ' : ''}${p.model || p.item_name} in ${p.condition || 'good'} condition? This is a ${p.category || 'collectible'} item. Provide current estimated resale value, auction estimate if applicable, and replacement value in USD.

Return ONLY valid JSON matching this shape, no markdown, no commentary:
{ "resale_value": number, "auction_estimate": number, "replacement_value": number, "source": string, "as_of_date": string }

The "source" should describe the basis (e.g. "Based on typical secondhand market and auction listings"). The "as_of_date" should be today's date in YYYY-MM-DD format. All monetary values must be plain numbers (no $ or commas). If auction_estimate is not applicable, use 0.`,
    schemaHint: 'resale_value, auction_estimate, replacement_value',
  };
};

const stripCodeFences = (s: string): string => {
  let t = s.trim();
  if (t.startsWith('```')) {
    // Remove leading ```json or ``` then trailing ```
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  return t;
};

const safeParseJson = (raw: string): any | null => {
  const cleaned = stripCodeFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt to extract first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* noop */ }
    }
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate user via JWT (signing-keys system)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as Payload;
    if (!body || !body.kind) {
      return new Response(JSON.stringify({ error: 'Missing valuation kind' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Per-kind required field validation
    if (body.kind === 'vehicle') {
      if (!body.year || !body.make || !body.model || !body.mileage) {
        return new Response(JSON.stringify({ error: 'Year, make, model, and mileage are required.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (body.kind === 'real_estate') {
      if (!body.address || String(body.address).trim().length < 5) {
        return new Response(JSON.stringify({ error: 'A complete address is required.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (body.kind === 'personal_property') {
      if (!body.item_name || !body.category) {
        return new Response(JSON.stringify({ error: 'Item name and category are required.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported valuation kind' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user } = buildPrompt(body);

    const aiResp = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a market valuation assistant. You produce best-effort estimates based on typical market data. You always respond with valid JSON only — no markdown, no prose.',
          },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, errText);
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 502;
      const message = status === 429
        ? 'Too many requests right now. Please try again in a moment.'
        : status === 402
        ? 'AI valuation credits are exhausted. Please add funds and try again.'
        : 'Could not reach the valuation service.';
      return new Response(JSON.stringify({ error: message }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || '';
    const parsed = safeParseJson(raw);

    if (!parsed) {
      console.error('Failed to parse AI valuation JSON:', raw);
      return new Response(JSON.stringify({ error: 'Could not parse valuation response. Please try again.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ valuation: parsed, kind: body.kind }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('ai-valuation error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
