import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  try {
    if (typeof window === 'undefined') {
      redis = Redis.fromEnv();
      return redis;
    }
  } catch {
    console.warn('Redis not configured - caching disabled');
  }
  return null;
}

function hashKey(space: string, platform: string): string {
  return `ideas:${space.toLowerCase()}:${platform.toLowerCase()}`;
}

export async function getCachedIdeas(space: string, platform: string) {
  const client = getRedis();
  if (!client) return null;
  
  try {
    const cached = await client.get<string>(hashKey(space, platform));
    if (cached) {
      return JSON.parse(cached) as {
        id: string;
        type: string;
        platform: string;
        content: string;
        used: boolean;
      }[];
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

export async function setCachedIdeas(
  space: string,
  platform: string,
  ideas: { id: string; type: string; platform: string; content: string; used: boolean }[]
) {
  const client = getRedis();
  if (!client) return;
  
  try {
    await client.set(hashKey(space, platform), JSON.stringify(ideas), { ex: 86400 });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function invalidateCache(space: string, platform?: string) {
  const client = getRedis();
  if (!client) return;
  
  try {
    if (platform) {
      await client.del(hashKey(space, platform));
    } else {
      const keys = await client.keys(`ideas:${space.toLowerCase()}:*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}