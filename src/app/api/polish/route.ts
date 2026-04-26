import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, platform, apiKey } = await request.json();
    
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const prompt = `Polish this social media post for ${platform}. Keep the voice authentic and human. Make it more engaging without being cringe. Return ONLY the improved post text, nothing else:\n\n${content}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const polished = data.content?.find((b: any) => b.type === 'text')?.text || content;

    return NextResponse.json({ polished });
  } catch (error) {
    console.error('Polish API error:', error);
    return NextResponse.json({ error: 'Failed to polish post' }, { status: 500 });
  }
}