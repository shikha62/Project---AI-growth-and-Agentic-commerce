import crypto from 'crypto';
import type { AuditEvent } from '@/types/commerce';

const isValidRazorpayConfig = Boolean(
  process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID.startsWith('rzp_'),
);

export type RazorpayPaymentContext = {
  orderId: string;
  amount: number;
  currency?: string;
};

export type RazorpayOrderPayload = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
};

export function verifyRazorpayWebhookSignature({
  body,
  signature,
  secret,
}: {
  body: string;
  signature: string;
  secret: string;
}) {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function createRazorpayOrder(
  context: RazorpayPaymentContext,
): Promise<{ order: RazorpayOrderPayload | null; paymentLink: string; isMock: boolean; audit: AuditEvent[] }> {
  const audit: AuditEvent[] = [
    {
      id: `razorpay-${Date.now()}`,
      stage: 'RAZORPAY_CHECK',
      status: 'INFO',
      message: 'Validating Razorpay test credentials before creating the live order.',
      timestamp: new Date().toISOString(),
    },
  ];

  if (!isValidRazorpayConfig) {
    audit.push({
      id: `razorpay-fallback-${Date.now()}`,
      stage: 'RAZORPAY_FALLBACK',
      status: 'WARN',
      message: 'Razorpay credentials are absent or invalid. Falling back to offline mock state for a graceful degraded experience.',
      metadata: {
        keyIdConfigured: Boolean(process.env.RAZORPAY_KEY_ID),
        environment: process.env.NODE_ENV ?? 'development',
      },
      timestamp: new Date().toISOString(),
    });

    return {
      order: null,
      paymentLink: `https://mock.local/pay/${context.orderId}`,
      isMock: true,
      audit,
    };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(context.amount * 100),
        currency: context.currency ?? 'INR',
        receipt: context.orderId,
        notes: {
          source: 'agentic-commerce',
          merchantOrderId: context.orderId,
        },
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Razorpay order creation failed: ${response.status} ${payload}`);
    }

    const payload = (await response.json()) as RazorpayOrderPayload & { id?: string };

    audit.push({
      id: `razorpay-order-${Date.now()}`,
      stage: 'RAZORPAY_ORDER_CREATED',
      status: 'SUCCESS',
      message: 'Razorpay order was created successfully using live server-side credentials.',
      metadata: {
        orderId: payload.id,
        amount: payload.amount,
        currency: payload.currency,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      order: payload,
      paymentLink: `${baseUrl}/checkout?order_id=${payload.id}`,
      isMock: false,
      audit,
    };
  } catch (error) {
    const failureMessage = error instanceof Error ? error.message : 'Unexpected Razorpay API failure';
    audit.push({
      id: `razorpay-error-${Date.now()}`,
      stage: 'RAZORPAY_FAILURE',
      status: 'ERROR',
      message: 'Razorpay order creation failed. The system has switched to offline mock mode to avoid a hard crash.',
      metadata: { error: failureMessage },
      timestamp: new Date().toISOString(),
    });

    return {
      order: null,
      paymentLink: `https://mock.local/pay/${context.orderId}`,
      isMock: true,
      audit,
    };
  }
}

export async function createRazorpayPaymentLink(
  context: RazorpayPaymentContext,
): Promise<{ url: string; id: string; isMock: boolean; audit: AuditEvent[] }> {
  const orderResult = await createRazorpayOrder(context);

  if (orderResult.order) {
    return {
      url: orderResult.paymentLink,
      id: orderResult.order.id,
      isMock: false,
      audit: orderResult.audit,
    };
  }

  return {
    url: orderResult.paymentLink,
    id: `mock_${context.orderId}`,
    isMock: true,
    audit: orderResult.audit,
  };
}
