import { NextRequest, NextResponse } from 'next/server';
import { callAI, HUMAN_CENTRIC_POLISH } from '@/lib/ai';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { content, platform, apiKey, provider = 'anthropic' } = await request.json();
    
    const key = apiKey || process.env.API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key required. Add one in Settings.' }, { status: 400 });
    }

    const userMsg = `Platform: ${platform}\n\nPost to polish:\n${content}`;
    const polished = await callAI(provider, key, HUMAN_CENTRIC_POLISH, userMsg);

    if (!polished) {
      return NextResponse.json({ error: 'Empty response from API' }, { status: 500 });
    }

    return NextResponse.json({ polished: polished.trim() });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Polish API error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}