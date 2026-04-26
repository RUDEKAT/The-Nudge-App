import { NextRequest, NextResponse } from 'next/server';
import { callAI, HUMAN_CENTRIC_IDEAS } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { prompt, apiKey, provider = 'anthropic' } = body;
    
    const key = apiKey || process.env.API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key required. Add one in Settings.' }, { status: 400 });
    }

    console.log(`[${Date.now() - startTime}ms] Calling ${provider} API...`);
    
    const text = await callAI(provider, key, HUMAN_CENTRIC_IDEAS, prompt);
    
    if (!text) {
      return NextResponse.json({ error: 'Empty response from API. Check your key.' }, { status: 500 });
    }
    
    // Clean up the response - remove markdown code blocks
    const cleaned = text.replace(/```json|```/g, '').trim();
    const ideas = JSON.parse(cleaned);

    return NextResponse.json({ ideas });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Ideas API error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}