import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function createRatelimit() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
  });
}

const ratelimit = createRatelimit();

export async function checkAuthRateLimit(identifier: string): Promise<boolean> {
  if (!ratelimit) return true;
  const { success } = await ratelimit.limit(`auth:${identifier}`);
  return success;
}
