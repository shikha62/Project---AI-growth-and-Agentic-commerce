import { NextResponse } from 'next/server';
import { catalog } from '@/lib/mock-data';
import { generateMerchantPlan } from '@/lib/ai-agent';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      merchantSummary?: string;
    };

    const plan = await generateMerchantPlan({
      merchantSummary: body.merchantSummary ?? 'Merchant is scaling operations and seeking higher repeat purchase value.',
      catalogSnapshot: catalog.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      })),
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI plan generation failure';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
