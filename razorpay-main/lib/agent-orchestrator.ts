import type { AgentExecutionResult, AuditEvent, CampaignOffer, Product } from '@/types/commerce';
import { catalog } from '@/lib/mock-data';

const AGENT_LIMITS = {
  maxSpend: Number(process.env.AGENT_MAX_SPEND ?? 1500),
  maxDiscountRatio: Number(process.env.AGENT_MAX_DISCOUNT_RATIO ?? 0.18),
  hitlThreshold: Number(process.env.AGENT_HITL_THRESHOLD ?? 600),
};

export function getCatalogAsJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Agentic Commerce Product Catalog',
    description: 'AI-readable merchant catalog exposed for autonomous discovery and offer negotiation.',
    itemListElement: catalog.map((product) => ({
      '@type': 'Product',
      sku: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'INR',
        availability: product.stock > 0 ? 'InStock' : 'OutOfStock',
      },
      keywords: product.tags,
    })),
  };
}

export function buildCampaignOffer({
  merchantSummary,
  cartItems,
}: {
  merchantSummary: string;
  cartItems: Product[];
}): CampaignOffer | null {
  const candidate = catalog.find((product) => product.category === 'marketing' || product.category === 'software');
  if (!candidate) return null;

  const currentCartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const discount = Math.min(Math.round((candidate.price * AGENT_LIMITS.maxDiscountRatio) / 100) * 100, 800);

  return {
    offerId: `off-${candidate.id}`,
    productId: candidate.id,
    offerType: 'upsell',
    reason: `The merchant is already buying operational tools; this add-on improves retention and increases LTV.`,
    discount,
    total: Math.max(candidate.price - discount, 0),
    rationale: [
      merchantSummary,
      `Cart value before offer: ₹${currentCartTotal.toLocaleString('en-IN')}`,
      'Bounded discount is below configured policy threshold.',
    ],
  };
}

export function createAuditEntry(
  stage: string,
  status: AuditEvent['status'],
  message: string,
  metadata?: Record<string, unknown>,
): AuditEvent {
  return {
    id: `${stage}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    stage,
    status,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

export async function executeAgentCommerceFlow({
  cartItems,
  merchantSummary,
}: {
  cartItems: Product[];
  merchantSummary: string;
}): Promise<AgentExecutionResult> {
  const audit: AuditEvent[] = [
    createAuditEntry('CATALOG_PARSED', 'INFO', 'Catalog loaded and normalized for agent discovery.', {
      productCount: catalog.length,
    }),
  ];

  const offer = buildCampaignOffer({ merchantSummary, cartItems });

  if (!offer) {
    return {
      ok: false,
      audit: [
        ...audit,
        createAuditEntry('NO_MATCH', 'WARN', 'No eligible upsell could be generated for the current cart profile.'),
      ],
      failureReason: 'No eligible upsell candidate found.',
    };
  }

  const totalBeforeOffer = cartItems.reduce((sum, item) => sum + item.price, 0);
  const totalWithOffer = totalBeforeOffer + offer.total;

  if (totalWithOffer > AGENT_LIMITS.maxSpend) {
    audit.push(
      createAuditEntry(
        'SPEND_GUARD',
        'WARN',
        'Offer exceeds automated spend bound. Human approval required or offer reduced.',
        { totalWithOffer, maxSpend: AGENT_LIMITS.maxSpend },
      ),
    );

    return {
      ok: false,
      audit,
      failureReason: 'Offer exceeds the automated spend guard.',
      recovery: { renegotiatedOffer: AGENT_LIMITS.maxSpend },
    };
  }

  if (offer.discount > AGENT_LIMITS.maxSpend * AGENT_LIMITS.maxDiscountRatio) {
    audit.push(
      createAuditEntry('DISCOUNT_GUARD', 'WARN', 'Discount ratio is over policy threshold; the agent will not auto-apply it.', {
        discount: offer.discount,
        maxDiscountRatio: AGENT_LIMITS.maxDiscountRatio,
      }),
    );

    return {
      ok: false,
      audit,
      failureReason: 'Discount policy guard blocked auto execution.',
    };
  }

  const needsHitl = totalWithOffer >= AGENT_LIMITS.hitlThreshold;
  const orderId = `ord_${Date.now()}`;

  audit.push(
    createAuditEntry('UPSELL_MATCHED', 'SUCCESS', 'Upsell candidate identified and validated against bounded policy gates.', {
      offerId: offer.offerId,
      totalWithOffer,
      needsHitl,
    }),
  );

  if (needsHitl) {
    audit.push(
      createAuditEntry('HUMAN_APPROVAL_REQUIRED', 'INFO', 'High-value transaction paused for explicit approval before payment link generation.', {
        orderId,
      }),
    );

    return {
      ok: true,
      offer,
      orderId,
      audit,
    };
  }

  audit.push(
    createAuditEntry('ORDER_CREATED', 'SUCCESS', 'Order drafted and ready for payment orchestration.', {
      orderId,
      total: totalWithOffer,
    }),
  );

  return {
    ok: true,
    offer,
    orderId,
    paymentLink: `https://example.test/pay/${orderId}`,
    paymentUrl: `https://example.test/pay/${orderId}`,
    audit,
  };
}
