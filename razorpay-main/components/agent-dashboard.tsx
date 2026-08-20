'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AuditEvent, CampaignOffer } from '@/types/commerce';

const DEFAULT_CART = ['sku-1001', 'sku-2001'];

type CheckoutResponse = {
  ok: boolean;
  orderId?: string;
  offer?: CampaignOffer;
  paymentLink?: string;
  paymentId?: string;
  isMock?: boolean;
  audit?: AuditEvent[];
  reasoning?: {
    summary: string;
    gateStatus: string;
  };
  failureReason?: string;
  recovery?: {
    alternativeSku?: string;
    renegotiatedOffer?: number;
  };
};

type MerchantPlan = {
  recommendation: string;
  strategy: string[];
  riskFlags: string[];
  confidence: number;
};

function formatCurrency(value?: number) {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AgentDashboard() {
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [plan, setPlan] = useState<MerchantPlan | null>(null);

  const runCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: DEFAULT_CART,
          merchantSummary:
            'Merchant is expanding rapidly with existing accounting and logistics tooling, and needs an agentic upsell strategy to lift repeat purchase rate.',
        }),
      });

      const result = (await response.json()) as CheckoutResponse;
      setCheckout(result);
    } finally {
      setLoading(false);
    }
  };

  const runPlan = async () => {
    const response = await fetch('/api/v1/agent/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantSummary:
          'Merchant is scaling operations and wants AI-driven upsell recommendations that preserve margins while increasing LTV.',
      }),
    });

    const result = (await response.json()) as { ok: boolean; plan?: MerchantPlan };
    if (result.ok && result.plan) {
      setPlan(result.plan);
    }
  };

  useEffect(() => {
    void runCheckout();
    void runPlan();
  }, []);

  const auditTrail = useMemo(() => checkout?.audit ?? [], [checkout]);

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-8 py-10 text-[#F4EDE3]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 text-sm uppercase tracking-[0.18em] text-[#D9A55F]">Track 01</div>
        <h1 className="text-5xl font-black tracking-[-0.07em] text-[#F4EDE3] md:text-7xl">
          AI Growth &amp; Agentic Commerce
        </h1>
        <p className="mt-6 max-w-5xl text-2xl text-[#F4EDE3]/85 md:text-3xl">
          Grow the merchant&apos;s revenue and make them sellable to AI buyers.
        </p>

        <div className="mt-10 border-t border-[#2A241F] pt-6">
          <p className="max-w-6xl text-xl leading-relaxed text-[#F4EDE3] md:text-2xl">
            Build an agent that grows revenue for a merchant on Razorpay test-mode APIs, or that makes a merchant
            transact-able by an AI buyer end to end.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#2A241F] bg-[#171410] p-6 shadow-glow">
            <h2 className="mb-4 text-xl font-bold uppercase tracking-[0.14em] text-[#D9A55F] md:text-2xl">Why now</h2>
            <p className="text-lg leading-8 text-[#F4EDE3]/90">
              NPCI&apos;s UAP and the global protocol race (ACP, AP2, x402) make agent-to-agent commerce the open problem of the
              year, and Razorpay&apos;s in-app pilots are already live.
            </p>
          </section>

          <section className="rounded-2xl border border-[#2A241F] bg-[#171410] p-6 shadow-glow">
            <h2 className="mb-4 text-xl font-bold uppercase tracking-[0.14em] text-[#D9A55F] md:text-2xl">
              Example directions
            </h2>
            <ul className="space-y-3 text-lg text-[#F4EDE3]/90">
              <li>+ Conversational in-app checkout</li>
              <li>+ Agent-readable catalog</li>
              <li>+ Upsell &amp; cross-sell agent</li>
              <li>+ Campaign orchestrator</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 rounded-2xl border border-[#2A241F] bg-[#171410] p-6 shadow-glow">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold uppercase tracking-[0.12em] text-[#D9A55F] md:text-2xl">The bar</h2>
            <button
              type="button"
              onClick={() => {
                void runCheckout();
                void runPlan();
              }}
              className="rounded-full border border-[#D9A55F] bg-[#D9A55F]/10 px-4 py-2 text-sm font-semibold text-[#F5D39A] transition hover:bg-[#D9A55F]/20"
            >
              {loading ? 'Running agent…' : 'Re-run agent'}
            </button>
          </div>

          <p className="mt-4 max-w-5xl text-lg leading-relaxed text-[#F4EDE3]/90 md:text-xl">
            Every money action is explainable, bounded, and gated. Show the audit trail and one failure handled gracefully.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-lg font-semibold uppercase tracking-[0.12em] text-[#D9A55F]">Offer preview</h3>
                {checkout?.offer ? (
                  <div className="rounded-xl border border-[#2A241F] bg-[#0D0D0D] p-4">
                    <p className="text-xl font-semibold">{checkout.offer.offerType.toUpperCase()} offer</p>
                    <p className="mt-2 text-[#F4EDE3]/80">Reason: {checkout.offer.reason}</p>
                    <p className="mt-2 text-[#F4EDE3]/80">Discount: {formatCurrency(checkout.offer.discount)}</p>
                    <p className="mt-2 text-[#F4EDE3]/80">Total: {formatCurrency(checkout.offer.total)}</p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-[#2A241F] bg-[#0D0D0D] p-4 text-[#F4EDE3]/70">
                    {loading ? 'Preparing offer…' : 'No offer generated yet.'}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold uppercase tracking-[0.12em] text-[#D9A55F]">AI reasoning</h3>
                {plan ? (
                  <div className="rounded-xl border border-[#2A241F] bg-[#0D0D0D] p-4">
                    <p className="text-sm uppercase tracking-[0.1em] text-[#D9A55F]">Confidence {plan.confidence.toFixed(2)}</p>
                    <p className="mt-3 text-[#F4EDE3]/90">{plan.recommendation}</p>
                    <ul className="mt-4 space-y-2 text-sm text-[#F4EDE3]/80">
                      {plan.strategy.map((step) => (
                        <li key={step}>• {step}</li>
                      ))}
                    </ul>
                    {plan.riskFlags.length > 0 && (
                      <div className="mt-4 rounded-lg border border-[#D9A55F]/30 bg-[#D9A55F]/5 p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-[#F5D39A]">Risk flags</p>
                        <ul className="mt-2 space-y-1 text-sm text-[#F4EDE3]/80">
                          {plan.riskFlags.map((risk) => (
                            <li key={risk}>- {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl border border-[#2A241F] bg-[#0D0D0D] p-4 text-[#F4EDE3]/70">Waiting for AI strategy…</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold uppercase tracking-[0.12em] text-[#D9A55F]">Audit trail</h3>
              <div className="space-y-2">
                {auditTrail.length > 0 ? (
                  auditTrail.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-[#2A241F] bg-[#0D0D0D] p-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium text-[#F4EDE3]">{entry.stage}</span>
                        <span className="text-xs uppercase tracking-[0.1em] text-[#D9A55F]">{entry.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#F4EDE3]/80">{entry.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-[#2A241F] bg-[#0D0D0D] p-4 text-[#F4EDE3]/70">No audit events logged yet.</p>
                )}
              </div>

              {checkout?.failureReason && (
                <div className="mt-4 rounded-xl border border-[#D9A55F]/40 bg-[#D9A55F]/5 p-4 text-[#F5D39A]">
                  <p className="text-xs uppercase tracking-[0.12em]">Failure handling</p>
                  <p className="mt-2 text-sm">{checkout.failureReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
