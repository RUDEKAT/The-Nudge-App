# nudge

Post without the panic.

A clean, minimal social media posting assistant that helps you create authentic content without the anxiety. Built with Next.js, React, and Zustand.

## Features

- **Onboarding** - Quick 3-step setup to tailor your experience
- **AI Ideas** - Generate human-centered post ideas tailored to your niche
- **AI Polish** - Turn rough thoughts into authentic posts
- **Smart Hashtags** - Relevant hashtags that fit naturally
- **Platform Limits** - Each post optimized for its platform (X: 280, IG: 2200, LinkedIn: 3000, TikTok: 150)
- **Multiple AI Providers** - Use Anthropic, Groq (free), OpenAI, or DeepSeek (free)
- **Streak Tracking** - Stay consistent with your posting goals

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Zustand (state management with persistence)
- TypeScript
- Font Awesome (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## API Keys

Bring your own API key. Supported providers:

| Provider | Free | Model |
|----------|------|-------|
| Anthropic (Claude) | No | claude-sonnet-4-20250514 |
| Groq | Yes | llama-3.1-70b-versatile |
| OpenAI (GPT) | No | gpt-4o-mini |
| DeepSeek | Yes | deepseek-chat |

## Deployment

Deploy to Vercel with one click:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nudge)

## Support

Ko-fi: https://ko-fi.com/nudge

## License

MIT