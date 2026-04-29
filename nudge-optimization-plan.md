# Nudge App — Optimization Plan for Scale

> **App:** [nudgeapp.vercel.app](https://nudgeapp.vercel.app)  
> **Tagline:** Post without the panic  
> **Goal:** Prepare the app for larger-scale usage across infrastructure, AI, auth, monetization, analytics, and UX.

---

## 0. Urgent Fix (Do First)

- [x] Domain/URL is configured at `nudgeapp.vercel.app`
  - Redirects from old URLs should be set up in Vercel dashboard

---

## 1. Infrastructure & Performance ✅ Ready for Production

### What's Done
- [x] Zustand with `localStorage` persistence (`src/stores/useAppStore.ts:99-160`)
- [x] Multiple AI providers configured (Anthropic, OpenAI, Groq, DeepSeek)
- [x] Next.js 14 with App Router deployed on Vercel
- [x] Redis caching for AI responses (`src/lib/cache.ts` + `src/app/api/ideas/route.ts`)
- [x] Rate limiting on API routes (`src/lib/ratelimit.ts`)
- [x] Upstash Redis configured on Vercel

### What's Pending
- [ ] ~~Upgrade from Vercel Hobby → Vercel Pro~~ — Do when scaling
```ts
// src/lib/cache.ts (NEW)
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedIdeas(userSpace: string, platform: string) {
  const cached = await redis.get(`ideas:${userSpace}:${platform}`);
  return cached ? JSON.parse(cached as string) : null;
}

export async function setCachedIdeas(userSpace: string, platform: string, ideas: any[]) {
  await redis.set(`ideas:${userSpace}:${platform}`, JSON.stringify(ideas), { ex: 86400 });
}
```

### Rate Limiting
```ts
// middleware.ts (NEW)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

---

## 2. AI & Content Engine ✅ Partial Implementation

### What's Done
- [x] AI prompts structured as exported constants (`src/lib/ai.ts:115-153`)
- [x] Multiple AI provider support with fallback logic
- [x] Streaming responses structure ready (Vercel AI SDK can be added)

### What's Pending
- [ ] Move prompts to versioned config/database
- [ ] Implement streaming with Vercel AI SDK
- [ ] Add feedback loop (👍/👎) on ideas

### Prompt Management (In Progress)
```ts
// src/lib/prompts.ts (NEW - Extract from ai.ts)
export interface PromptConfig {
  id: string;
  version: number;
  space: string[];
  platform: string[];
  template: string;
  createdAt: Date;
}

// src/lib/prompts.ts
export const PROMPTS: PromptConfig[] = [
  {
    id: 'ideas-v1',
    version: 1,
    space: ['all'],
    platform: ['ig', 'tw', 'li', 'tk'],
    template: HUMAN_CENTRIC_IDEAS,
    createdAt: new Date('2026-04-01'),
  },
];
```

### Streaming Implementation
```ts
// src/app/api/ideas/stream/route.ts (NEW)
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { prompt, apiKey, provider } = await req.json();
  
  const result = streamText({
    model: openai("gpt-4o-mini"),
    prompt,
    apiKey,
  });

  return result.toDataStreamResponse();
}
```

### Feedback Loop Schema
```ts
// Add to src/stores/useAppStore.ts
interface IdeaFeedback {
  ideaId: string;
  userId: string;
  space: string;
  platform: string;
  rating: 'up' | 'down';
  createdAt: Date;
}
```

---

## 3. Auth & User Management 🚧 In Progress

### What's Done
- [x] Onboarding flow saves user preferences to Zustand store (`src/app/page.tsx:29-58`)
- [x] `localStorage` persistence via Zustand persist middleware
- [x] User profile schema defined (niche, frequency, streak tracking)

### What's Pending
- [ ] Add full auth (Clerk/Supabase/NextAuth)
- [ ] Save onboarding answers to user profile on completion
- [ ] Returning users should never redo onboarding

### Pre-Auth Persistence ✅ Done
- [x] User preferences persisted in `localStorage` via `zustand/middleware`
- [x] Session survives page refresh
- [x] Onboarding completion state saved

```ts
// src/stores/useAppStore.ts - Already implemented
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'nudge-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        platforms: state.platforms,
        posts: state.posts,
        apiKey: state.apiKey,
        apiProvider: state.apiProvider,
      }),
    }
  )
);
```

### Auth Implementation Plan
```bash
# Step 1: Install Clerk
npm install @clerk/nextjs

# Step 2: Wrap app in ClerkProvider (src/app/layout.tsx)
import { ClerkProvider } from '@clerk/nextjs';

# Step 3: Protect routes with middleware
```

---

## 4. Monetization Readiness 📋 Planned

### Tier Structure Defined
| Feature | Free | Pro |
|---|---|---|
| Post ideas per day | 5 | Unlimited |
| Platforms supported | 1 | All |
| Reminder scheduling | Basic | Advanced |
| Idea history | Last 7 days | Full history |
| AI tone customization | ❌ | ✅ |

### Implementation Plan
- [ ] Wire up Stripe products and prices
- [ ] Add `checkQuota(userId)` middleware
- [ ] Show upgrade CTA when limits hit
- [ ] Create `stripeCustomerId` and `plan` on user record

```bash
npm install stripe @stripe/stripe-js
```

```ts
// src/lib/stripe.ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function checkQuota(userId: string): Promise<{ canProceed: boolean; reason?: string }> {
  // Check free tier limits
  const ideasGeneratedToday = await getIdeasCountToday(userId);
  if (ideasGeneratedToday >= 5) {
    return { canProceed: false, reason: 'Daily limit reached. Upgrade to Pro for unlimited ideas.' };
  }
  return { canProceed: true };
}
```

---

## 5. Analytics & Observability 📋 Planned

### Implementation Plan
- [ ] Add PostHog or Mixpanel
- [ ] Add Sentry error monitoring
- [ ] Log LLM token usage per request

### Events to Track
```ts
// src/lib/analytics.ts
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  // PostHog example
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(event, properties);
  }
};

// Track in app:
trackEvent('idea_generated', { niche: userNiche, platform: platform });
trackEvent('idea_used', { ideaType: idea.type });
trackEvent('reminder_set', { platform: platform });
```

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### LLM Cost Tracking Schema
```ts
interface TokenUsage {
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  createdAt: Date;
}
```

---

## 6. UX at Scale ✅ Partial Implementation

### What's Done
- [x] Loading state during idea generation (`src/app/page.tsx:429-434`)
- [x] Empty states for ideas tab
- [x] Onboarding flow with progress indicators
- [x] Toast notifications for success/error feedback
- [x] Character limit indicators in compose

### What's Pending
- [ ] Skeleton loaders for all AI-generated content
- [ ] Explicit empty states for:
  - No saved ideas
  - No reminders set
  - First-time user after onboarding
- [ ] Improved error UX with retry logic

### Loading State ✅ Done
```tsx
// src/app/page.tsx:432-434
{isGenerating && (
  <div className="loading"><div className="ldot"></div><div className="ldot"></div><div className="ldot"></div></div>
)}
```

### Error UX Improvements Needed
```ts
// Add exponential backoff to API calls
const retryWithBackoff = async (fn: () => Promise<T>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};
```

---

## 7. Suggested Tech Stack for Scale ✅ Aligned

| Layer | Status | Current Implementation |
|---|---|---|
| Framework | ✅ | Next.js 14 (App Router) |
| Caching | ✅ | Upstash Redis (implemented) |
| Auth | 🚧 | Pre-auth: Zustand + localStorage |
| Database | 📋 | Planned: Supabase (Postgres) |
| AI | ✅ | Multi-provider (Anthropic, OpenAI, Groq, DeepSeek) |
| Payments | 📋 | Planned: Stripe |
| Analytics | ✅ | PostHog (configured, needs key) |
| Error tracking | ✅ | Sentry (configured, needs DSN) |
| Hosting | ✅ | Vercel |
| Email | 📋 | Planned: Resend |

---

## 8. Prioritized Execution Order

| Priority | Task | Status |
|---|---|---|
| 🔴 | Domain URL setup | ✅ Done |
| 🔴 | Auth + user persistence | 🚧 Partial (localStorage) |
| 🟠 | Add auth (Clerk) | 📋 Planned |
| 🟠 | ~~Caching + rate limiting~~ | ✅ Done (Redis caching, rate limiting) |
| 🟠 | ~~Analytics + error tracking~~ | ✅ Done (Sentry + PostHog configured) |
| 🟡 | Wire up Stripe | 📋 Planned |
| 🟡 | Streaming AI responses | 📋 Planned |
| 🟢 | Feedback loop on ideas | 📋 Planned |
| 🟢 | Prompt versioning | 📋 Planned |

---

## 9. Implementation Progress

### Completed ✅
- [x] Multi-step onboarding flow
- [x] AI-powered idea generation (4 providers)
- [x] Post polishing and hashtag suggestions
- [x] Scheduling interface
- [x] Streak tracking
- [x] Platform selection (Instagram, X, LinkedIn, TikTok)
- [x] Local storage persistence
- [x] Toast notifications system
- [x] Redis caching for AI responses (`src/lib/cache.ts`)
- [x] Rate limiting on API routes (`src/lib/ratelimit.ts`)
- [x] Sentry error monitoring configured (`sentry.client.config.ts`, `sentry.server.config.ts`)
- [x] PostHog analytics configured (`src/lib/analytics.ts`)
- [x] Skeleton loaders for idea generation (`src/components/SkeletonLoaders.tsx`)
- [x] Stripe integration (`src/lib/stripe.ts`, `src/app/api/checkout`, `src/app/api/webhooks`)
- [x] Idea feedback system (👍/👎)

### Planned 📋
- [ ] Full authentication (Clerk)
- [ ] Database persistence (Supabase)
- [ ] Streaming AI responses

---

## 10. Next Steps (Quick Wins)

1. ~~Redis caching + rate limiting~~ — ✅ Done (configured on Vercel)
2. ~~Sentry error monitoring~~ — ✅ Done (configured, add DSN to Vercel)
3. ~~PostHog analytics~~ — ✅ Done (configured, add key to Vercel)
4. ~~Skeleton loaders~~ — ✅ Done (`src/components/SkeletonLoaders.tsx`)

---

*Generated for the Nudge app — April 2026*
*Last updated: May 2026*
