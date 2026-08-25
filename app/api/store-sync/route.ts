import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

function googleEndpoint() {
  return String(process.env.INAM_API_ENDPOINT || process.env.NEXT_PUBLIC_INAM_API_ENDPOINT || '').trim();
}

function configurationError() {
  return NextResponse.json({
    ok: false,
    error: 'Shared synchronization is not configured. Add INAM_API_ENDPOINT in Vercel and redeploy.',
  }, { status: 503, headers: noStoreHeaders });
}

async function relay(upstream: Response) {
  const text = await upstream.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status, headers: noStoreHeaders });
  } catch {
    return NextResponse.json({
      ok: false,
      error: 'Google Apps Script returned an invalid response. Deploy it as a Web app with access set to Anyone.',
    }, { status: 502, headers: noStoreHeaders });
  }
}

export async function GET(request: NextRequest) {
  const endpoint = googleEndpoint();
  if (!endpoint) return configurationError();
  try {
    const target = new URL(endpoint);
    request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
    target.searchParams.set('_proxy', Date.now().toString());
    const upstream = await fetch(target, { cache: 'no-store', redirect: 'follow' });
    return relay(upstream);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Google synchronization request failed.' }, { status: 502, headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  const endpoint = googleEndpoint();
  if (!endpoint) return configurationError();
  try {
    const body = await request.text();
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      cache: 'no-store',
      redirect: 'follow',
    });
    return relay(upstream);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Google synchronization request failed.' }, { status: 502, headers: noStoreHeaders });
  }
}
