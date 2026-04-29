import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { callAI, HUMAN_CENTRIC_IDEAS } from '@/lib/ai';
import { getCachedIdeas, setCachedIdeas } from '@/lib/cache';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Rate limiting
  const ip = getClientIP(request);
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.', retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { prompt, apiKey, provider = 'anthropic', space, platform, useCache = true } = body;
    
    const key = apiKey || process.env.API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key required. Add one in Settings.' }, { status: 400 });
    }

    // Try cache first if space and platform are provided
    if (useCache && space && platform) {
      const cached = await getCachedIdeas(space, platform);
      if (cached && cached.length > 0) {
        console.log(`[${Date.now() - startTime}ms] Cache hit for ${space}:${platform}`);
        return NextResponse.json({ ideas: cached, cached: true });
      }
    }
    
    console.log(`[${Date.now() - startTime}ms] Calling ${provider} API...`);
    
    const text = await callAI(provider, key, HUMAN_CENTRIC_IDEAS, prompt);
    
    if (!text) {
      return NextResponse.json({ error: 'Empty response from API. Check your key.' }, { status: 500 });
    }
    
    // Clean up the response - extract JSON array using regex
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse ideas from AI response: ' + text }, { status: 500 });
    }
    const cleaned = jsonMatch[0];
    const ideas = JSON.parse(cleaned);

    // Cache the result if space and platform are provided
    if (space && platform && ideas.length > 0) {
      await setCachedIdeas(space, platform, ideas);
      console.log(`[${Date.now() - startTime}ms] Cached ideas for ${space}:${platform}`);
    }

    return NextResponse.json({ ideas, cached: false });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Ideas API error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}