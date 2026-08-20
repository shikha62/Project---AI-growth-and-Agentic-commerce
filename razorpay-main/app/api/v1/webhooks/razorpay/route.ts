import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') ?? '';
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';

    if (!secret || !signature) {
      return NextResponse.json({ ok: false, error: 'Missing secret or signature' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature({
      body: rawBody,
      signature,
      secret,
    });

    if (!isValid) {
      return NextResponse.json({ ok: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; status?: string } };
      };
    };

    return NextResponse.json({
      ok: true,
      event: payload.event ?? 'unknown',
      paymentStatus: payload.payload?.payment?.entity?.status ?? 'unknown',
    });
  } catch (error) {
    console.error('Razorpay webhook validation failed', error);
    return NextResponse.json({ ok: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}
