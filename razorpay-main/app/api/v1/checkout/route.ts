import { NextResponse } from 'next/server';
import { catalog } from '@/lib/mock-data';
import { createAuditEntry, executeAgentCommerceFlow } from '@/lib/agent-orchestrator';
import { createRazorpayPaymentLink } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cartItems?: Array<{ id: string; quantity?: number } | string>;
      merchantSummary?: string;
    };

    const normalizedCartItems = (body.cartItems ?? ['sku-1001', 'sku-2001']).map((item) => {
      const itemId = typeof item === 'string' ? item : item.id;
      const match = catalog.find((product) => product.id === itemId);
      return match ?? null;
    });

    const cartItems = normalizedCartItems.filter((item): item is (typeof catalog)[number] => item !== null);

    const merchantSummary = body.merchantSummary ?? 'Merchant requires revenue growth and AI buyer readiness.';

    const flow = await executeAgentCommerceFlow({ cartItems, merchantSummary });

    if (!flow.ok || !flow.offer || !flow.orderId) {
      return NextResponse.json(
        {
          ok: false,
          reason: flow.failureReason ?? 'Agent flow rejected the transaction.',
          audit: flow.audit,
        },
        { status: 400 },
      );
    }

    const payment = await createRazorpayPaymentLink({
      orderId: flow.orderId,
      amount: flow.offer.total,
      currency: 'INR',
    });

    const audit = [...flow.audit, ...payment.audit];
    return NextResponse.json({
      ok: true,
      orderId: flow.orderId,
      offer: flow.offer,
      paymentLink: payment.url,
      paymentId: payment.id,
      isMock: payment.isMock,
      audit,
      reasoning: {
        summary: flow.offer.rationale.join(' | '),
        gateStatus: 'passed',
      },
    });
  } catch (error) {
    const failure = error instanceof Error ? error.message : 'Unknown checkout failure';
    return NextResponse.json(
      {
        ok: false,
        reason: 'Checkout orchestration failed unexpectedly.',
        details: failure,
        audit: [
          createAuditEntry('CHECKOUT_FAIL', 'ERROR', 'Unexpected checkout orchestration failure while processing buyer request.', {
            error: failure,
          }),
        ],
      },
      { status: 500 },
    );
  }
}
