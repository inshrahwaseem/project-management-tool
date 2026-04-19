export interface RateLimitStatus {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(options: {
  interval: number;
  uniqueTokenPerInterval: number;
}) {
  const tokenCache = new Map<string, number[]>();
  let lastIntervalReset = Date.now();

  return {
    check: (limit: number, token: string): Promise<RateLimitStatus> =>
      new Promise((resolve, reject) => {
        const now = Date.now();
        // Reset the cache interval if needed
        if (now - lastIntervalReset > options.interval) {
          tokenCache.clear();
          lastIntervalReset = now;
        }

        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;

        if (isRateLimited) {
          return reject({
            success: false,
            limit,
            remaining: 0,
            reset: lastIntervalReset + options.interval,
          });
        }

        return resolve({
          success: true,
          limit,
          remaining: limit - currentUsage,
          reset: lastIntervalReset + options.interval,
        });
      }),
  };
}
