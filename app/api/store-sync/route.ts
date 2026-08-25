import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

const bundledGoogleEndpoint = 'https://script.google.com/macros/s/AKfycbx2TxU8alkP692Jc_telvWLN6M7auDjVxkiSYDdmyuEFQdWPjfbp51zOK6osPUUe94z3Q/exec';

function googleEndpoint() {
  return String(process.env.INAM_API_ENDPOINT || process.env.NEXT_PUBLIC_INAM_API_ENDPOINT || bundledGoogleEndpoint).trim();
}

function configurationError() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Shared synchronization is not configured. Add INAM_API_ENDPOINT in Vercel and redeploy.',
    },
    { status: 503, headers: noStoreHeaders }
  );
}

async function fetchWithTimeout(url: string | URL, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function relay(upstream: Response) {
  const text = await upstream.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status, headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Google Apps Script returned an invalid response. Deploy it as a Web app with access set to Anyone.',
      },
      { status: 502, headers: noStoreHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  const endpoint = googleEndpoint();
  if (!endpoint) return configurationError();

  try {
    const target = new URL(endpoint);
    request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
    target.searchParams.set('_proxy', Date.now().toString());

    const upstream = await fetchWithTimeout(
      target.toString(),
      {
        method: 'GET',
        cache: 'no-store',
        redirect: 'follow',
      },
      15000
    );

    return relay(upstream);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      { ok: false, error: isTimeout ? 'Synchronization request timed out.' : error instanceof Error ? error.message : 'Google synchronization request failed.' },
      { status: 502, headers: noStoreHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  const endpoint = googleEndpoint();
  if (!endpoint) return configurationError();

  try {
    const body = await request.text();

    const upstream = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8' 
        },
        body: body || '{}',
        cache: 'no-store',
        redirect: 'follow',
      },
      20000
    );

    return relay(upstream);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      { ok: false, error: isTimeout ? 'Synchronization request timed out.' : error instanceof Error ? error.message : 'Google synchronization request failed.' },
      { status: 502, headers: noStoreHeaders }
    );
  }
}
