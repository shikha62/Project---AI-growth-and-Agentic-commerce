export type MerchantPlan = {
  recommendation: string;
  strategy: string[];
  riskFlags: string[];
  confidence: number;
};

function buildFallbackPlan(merchantSummary: string): MerchantPlan {
  return {
    recommendation: 'Prioritize a marketing automation upsell for a merchant already buying accounting and logistics tooling.',
    strategy: [
      'Bundle a retention engine into the operating stack to increase repeat-purchase LTV.',
      'Use a low-discount promotional tie-in to preserve margin while improving conversion quality.',
      'Surface an agent-readable product feed so AI buyers can discover and transact autonomously.',
    ],
    riskFlags: [
      'Discount cap must remain under policy threshold to avoid margin erosion.',
      'Any above-threshold transaction should require explicit human approval.',
    ],
    confidence: 0.87,
  };
}

export async function generateMerchantPlan({
  merchantSummary,
  catalogSnapshot,
}: {
  merchantSummary: string;
  catalogSnapshot: Array<{ id: string; name: string; category: string; price: number }>;
}): Promise<MerchantPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildFallbackPlan(merchantSummary);
  }

  const systemPrompt = `You are a senior commerce growth strategist for a merchant operating on Razorpay test-mode APIs. Return valid JSON only.`;
  const userPrompt = JSON.stringify({
    merchantSummary,
    catalogSnapshot,
    instructions: [
      'Recommend the strongest upsell or bundle based on existing purchase behavior.',
      'Keep the explanation bounded to policy-compliant, explainable commerce actions.',
      'Return JSON with keys: recommendation, strategy, riskFlags, confidence.',
    ],
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = payload.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(text) as Partial<MerchantPlan>;

    return {
      recommendation: parsed.recommendation ?? buildFallbackPlan(merchantSummary).recommendation,
      strategy: parsed.strategy ?? buildFallbackPlan(merchantSummary).strategy,
      riskFlags: parsed.riskFlags ?? buildFallbackPlan(merchantSummary).riskFlags,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.82,
    };
  } catch (error) {
    console.warn('AI plan generation failed, using local fallback logic.', error);
    return buildFallbackPlan(merchantSummary);
  }
}
