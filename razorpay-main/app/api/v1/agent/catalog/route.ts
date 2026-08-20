import { NextResponse } from 'next/server';
import { getCatalogAsJsonLd } from '@/lib/agent-orchestrator';

export async function GET() {
  const feed = getCatalogAsJsonLd();

  return NextResponse.json(feed, {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
