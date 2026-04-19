const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, section, sectionData, healthScore } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build health-score-aware tone guidance
    let scoreGuidance = '';
    if (healthScore && typeof healthScore.total_score === 'number') {
      const s = healthScore.total_score;
      const weakest = (healthScore.section_scores
        ? Object.entries(healthScore.section_scores)
            .map(([k, v]: any) => ({ k, pct: v.max > 0 ? v.score / v.max : 1, max: v.max }))
            .filter((x) => x.pct < 0.5)
            .sort((a, b) => b.max - a.max)
            .slice(0, 3)
            .map((x) => x.k)
        : []);
      const weakList = weakest.length ? weakest.join(', ') : 'none';
      if (s < 25) scoreGuidance = `The user's Packet Health Score is ${s}/100 (Critical). Their weakest sections are: ${weakList}. Open with empathy and urgency: their packet has critical gaps. Steer them to the highest-impact section first.`;
      else if (s < 50) scoreGuidance = `The user's Packet Health Score is ${s}/100 (At Risk). Their weakest sections are: ${weakList}. Acknowledge their start and point them to the most important things to add next.`;
      else if (s < 75) scoreGuidance = `The user's Packet Health Score is ${s}/100 (Good Progress). Their weakest sections are: ${weakList}. Affirm their progress and suggest a few specific items that will make a big difference.`;
      else scoreGuidance = `The user's Packet Health Score is ${s}/100 (Strong/Excellent). Offer finishing-touch suggestions and confirm they're well prepared.`;
    }

    // Build template suggestions based on critical gaps
    let templateGuidance = '';
    const gapLabels: string[] = (healthScore?.critical_gaps || []).map((g: any) => String(g.label || '').toLowerCase());
    const gapMatches: string[] = [];
    if (gapLabels.some((g) => g.includes('will'))) gapMatches.push('a Simple Will template');
    if (gapLabels.some((g) => g.includes('power of attorney') || g.includes('poa'))) {
      gapMatches.push('a Financial Power of Attorney template and a Healthcare Power of Attorney template');
    }
    if (gapLabels.some((g) => g.includes('directive') || g.includes('living will') || g.includes('healthcare'))) {
      gapMatches.push('a Healthcare Directive / Living Will template');
    }
    if (section === 'funeral') gapMatches.push('a Funeral Instruction Letter template');
    if (section === 'memories') gapMatches.push('a Letter to Loved Ones template');
    if (section === 'family') gapMatches.push('a Guardianship Nomination Letter template (if minor children)');
    if (gapMatches.length) {
      templateGuidance = `If the user has gaps you can address with a starter template, gently suggest opening one of these and remind them it is only a starting point that needs attorney review: ${gapMatches.join('; ')}. They can find templates by going to Profile → Legal Document Templates. Never imply these are finished legal documents.`;
    }

    const systemPrompt = `You are Haven, the wise and calm guide for Survivor Packet. Your role is to help users complete their life document packet so their loved ones are protected. You are warm, clear, and never morbid. You speak in short, direct sentences. You never say "I cannot" — instead, you guide. Never use markdown headers or bullet lists — respond in natural conversational sentences only.

${scoreGuidance}

${templateGuidance}

The user is currently in the ${section || 'dashboard'} section. Their current data is: ${JSON.stringify(sectionData || {})}. Identify what is missing and guide them to complete it step by step.`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages as Array<{ role: string; content: string }>)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: chatMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits required. Please add credits in workspace settings.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm here to help. What would you like to work on?";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Haven error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
