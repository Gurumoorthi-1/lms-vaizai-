import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient, isRedisConnected } from '../config/redis.js';

// Global AI Rate Limiter: 20 requests per hour per IP
// NOTE: Since all AI routes are behind protect middleware (JWT),
// only authenticated users will hit this limiter — effectively per-user.
let aiRateLimiterInstance;

const initRateLimiter = () => {
  const baseConfig = {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many AI requests, please try again after an hour'
    }
  };

  if (isRedisConnected() && getRedisClient()) {
    return rateLimit({
      ...baseConfig,
      store: new RedisStore({
        sendCommand: (...args) => getRedisClient().sendCommand(args),
      }),
    });
  }

  // Fallback to in-memory storage
  return rateLimit(baseConfig);
};

// Initialize on first use
const aiRateLimiter = (req, res, next) => {
  if (!aiRateLimiterInstance) {
    aiRateLimiterInstance = initRateLimiter();
  }
  return aiRateLimiterInstance(req, res, next);
};

export { aiRateLimiter };
