import { ApiProvider, API_PROVIDERS } from '@/stores/useAppStore';

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const OPENAI_BASE = 'https://api.openai.com/v1';
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

async function callAnthropic(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.find((c: any) => c.type === 'text')?.text || '';
}

async function callOpenAI(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || '';
}

async function callGroq(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  console.log('Groq response:', JSON.stringify(data));
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || '';
}

async function callDeepSeek(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || '';
}

export async function callAI(
  provider: ApiProvider,
  apiKey: string,
  system: string,
  user: string
): Promise<string> {
  const providerConfig = API_PROVIDERS.find(p => p.id === provider);
  const model = providerConfig?.model || 'claude-sonnet-4-20250514';
  
  switch (provider) {
    case 'anthropic':
      return callAnthropic(apiKey, model, system, user);
    case 'openai':
      return callOpenAI(apiKey, model, system, user);
    case 'groq':
      return callGroq(apiKey, model, system, user);
    case 'deepseek':
      return callDeepSeek(apiKey, model, system, user);
    default:
      return callAnthropic(apiKey, model, system, user);
  }
}

export const HUMAN_CENTRIC_SYSTEM = `You are a helpful social media assistant. Your goal is to help users create authentic, human-centered content that sounds like a real person talking to friends - not a corporation or AI. 

Write in a conversational tone that feels natural and approachable. Avoid:
- Corporate jargon or buzzwords
- Overly polished or artificial language  
- Generic "engagement" talk
- Anything that sounds like a sales pitch

Instead:
- Write like you're a real person sharing genuine insights
- Be specific and practical, not vague
- Include personal touches or relatable moments
- Keep it real, keep it human`;

export const HUMAN_CENTRIC_IDEAS = `${HUMAN_CENTRIC_SYSTEM}

Generate post ideas that are:
- Specific and actionable (not vague suggestions)
- Based on the user's actual niche and experience
- Easy to actually execute (under 30 min)
- Something they'd actually want to write, not just content for content's sake

Return ONLY valid JSON array, no markdown:
[{"type":"Post type","plat":"ig/tw/li/tk","text":"1-2 sentence idea"}]`;

export const HUMAN_CENTRIC_POLISH = `${HUMAN_CENTRIC_SYSTEM}

Improve this post to sound more human and authentic. Keep:
- The original message and intent
- The core message, just make it sound like you
- A natural conversational tone

Make it feel like a real person wrote it, not AI or a brand.`;

export const HUMAN_CENTRIC_HASHTAGS = `${HUMAN_CENTRIC_SYSTEM}

Suggest 5-8 relevant hashtags that fit naturally with this post content. Don't just add popular hashtags for the sake of it - only include ones that actually relate to the content.

Return ONLY the hashtags separated by spaces, nothing else.`;