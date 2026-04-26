import { NextRequest, NextResponse } from 'next/server';
import { callAI, HUMAN_CENTRIC_HASHTAGS } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { content, apiKey, provider = 'anthropic' } = await request.json();
    
    const key = apiKey || process.env.API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key required. Add one in Settings.' }, { status: 400 });
    }

    const hashtags = await callAI(provider, key, HUMAN_CENTRIC_HASHTAGS, content);

    if (!hashtags) {
      return NextResponse.json({ error: 'Empty response from API' }, { status: 500 });
    }

    return NextResponse.json({ hashtags: hashtags.trim() });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Hashtags API error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}