import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, apiKey } = await request.json();
    
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const ideas = JSON.parse(cleaned);

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Ideas API error:', error);
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 });
  }
}