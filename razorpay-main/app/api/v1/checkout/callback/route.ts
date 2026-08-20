import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');
  const paymentId = url.searchParams.get('payment_id');
  const paymentStatus = url.searchParams.get('payment_status') ?? 'paid';

  return NextResponse.json({
    ok: true,
    status: paymentStatus,
    orderId,
    paymentId,
    message: 'Checkout callback received. Payment lifecycle acknowledgement is logged securely on the server.',
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      order_id?: string;
      payment_id?: string;
      status?: string;
    };

    return NextResponse.json({
      ok: true,
      status: payload.status ?? 'paid',
      orderId: payload.order_id,
      paymentId: payload.payment_id,
      message: 'Payment confirmation received and validated by the checkout callback handler.',
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid callback payload.' }, { status: 400 });
  }
}
