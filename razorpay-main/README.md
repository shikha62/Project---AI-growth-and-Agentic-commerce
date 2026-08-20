# Agentic Commerce — Razorpay integration

> A lightweight Next.js demo showing an agent-driven commerce flow with Razorpay integration and graceful fallback to mocked payments for local dev.

## Tech stack

- Next.js (App Router) 14
- TypeScript
- Tailwind CSS

## What this repo contains

- `app/` — Next.js pages and API routes (app router).
  - API routes: [app/api/v1/checkout/route.ts](app/api/v1/checkout/route.ts#L1), [app/api/v1/webhooks/razorpay/route.ts](app/api/v1/webhooks/razorpay/route.ts#L1)
- `components/` — UI components used by the app.
- `lib/` — integration and helper logic (Razorpay client helpers, agent orchestrator, mock data).
  - Key file: [lib/razorpay.ts](lib/razorpay.ts#L1)
- `types/` — shared TypeScript types.

## Features

- Server-side Razorpay order creation using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- Webhook verification using `RAZORPAY_WEBHOOK_SECRET`.
- Automatic fallback to a mocked payment flow when Razorpay credentials are not configured (useful for offline development).

## Prerequisites

- Node.js 18+ (matches Next.js 14 requirements)
- npm, yarn, or pnpm

## Install

Install dependencies from the project root:

```bash
npm install
# or yarn
# yarn
```

## Environment

Create a `.env.local` in the project root with the variables below. Example:

```
RAZORPAY_KEY_ID=rzp_test_yourKeyHere
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are used server-side to call the Razorpay Orders API. The code checks `RAZORPAY_KEY_ID` for the `rzp_` prefix and will switch to a mocked flow if credentials are missing or invalid. See [lib/razorpay.ts](lib/razorpay.ts#L1).
- `RAZORPAY_WEBHOOK_SECRET` is used to validate incoming webhook signatures in [app/api/v1/webhooks/razorpay/route.ts](app/api/v1/webhooks/razorpay/route.ts#L1).
- `NEXT_PUBLIC_APP_URL` is used to construct the payment link fallback and checkout links (defaults to `http://localhost:3000`).

## Running locally

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

If you do not provide Razorpay credentials, the app will use a mock payment link flow so you can continue developing UI and agent logic without hitting the live API.

## Webhooks

- Incoming Razorpay webhooks are handled at the route implemented in [app/api/v1/webhooks/razorpay/route.ts](app/api/v1/webhooks/razorpay/route.ts#L1).
- When deploying, configure your Razorpay webhook URL to point at `<YOUR_PRODUCTION_URL>/api/v1/webhooks/razorpay` and set the same secret into `RAZORPAY_WEBHOOK_SECRET`.

## Key files

- `lib/razorpay.ts` — order creation, payment link generation, and webhook signature verification.
- `app/api/v1/checkout/route.ts` — checkout API entrypoint.
- `app/api/v1/agent/catalog/route.ts` — catalog agent API (agent-backed product/plan orchestration).

## Deployment

This is a standard Next.js app — recommended hosts: Vercel, Netlify, or any Node.js server that supports Next.js 14. Ensure your environment variables are set in the hosting dashboard.

## Notes

- The project includes sample agent logic and mock-data to exercise flows without external dependencies (see `lib/mock-data.ts`).
- For production, keep your `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` private and rotate keys as needed.

## License

This repository contains demo code. Add an appropriate license if you intend to publish or redistribute.

---
Generated README for the project by the developer assistant.
