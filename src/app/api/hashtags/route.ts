import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, apiKey } = await request.json();
    
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const prompt = `Suggest 5-8 relevant hashtags for this post. Return only the hashtags separated by spaces, nothing else:\n\n${content}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const hashtags = data.content?.find((b: any) => b.type === 'text')?.text || '#creator #content';

    return NextResponse.json({ hashtags });
  } catch (error) {
    console.error('Hashtags API error:', error);
    return NextResponse.json({ error: 'Failed to suggest hashtags' }, { status: 500 });
  }
}