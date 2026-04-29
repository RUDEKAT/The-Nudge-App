import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  
  try {
    if (typeof window === 'undefined') {
      const redis = Redis.fromEnv();
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: true,
      });
      return ratelimit;
    }
  } catch {
    console.warn('Rate limiting not configured');
  }
  return null;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = getRatelimit();
  if (!limiter) {
    return { success: true, remaining: 20, reset: Date.now() + 60000 };
  }

  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'anonymous';
}