export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: 'INR';
  stock: number;
  tags: string[];
  agentFriendly: boolean;
  bundleHints?: string[];
};

export type AuditEvent = {
  id: string;
  status: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

export type CampaignOffer = {
  offerId: string;
  productId: string;
  offerType: 'upsell' | 'cross-sell' | 'bundle';
  reason: string;
  discount: number;
  total: number;
  rationale: string[];
};

export type AgentExecutionResult = {
  ok: boolean;
  offer?: CampaignOffer;
  orderId?: string;
  paymentLink?: string;
  paymentUrl?: string;
  audit: AuditEvent[];
  failureReason?: string;
  recovery?: {
    alternativeSku?: string;
    renegotiatedOffer?: number;
  };
};
