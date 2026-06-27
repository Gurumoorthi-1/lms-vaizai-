import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;
let isRedisAvailable = false;

if (process.env.DISABLE_REDIS === 'true') {
  console.log('[Redis] Disabled via env. Using in-memory fallback.');
  redisClient = {
    get: async () => null,
    setEx: async () => {},
    del: async () => {},
    keys: async () => [],
    multi: () => {
      const ops = [];
      const pipeline = {
        del: (k) => { ops.push(k); return pipeline; },
        exec: async () => []
      };
      return pipeline;
    },
    on: () => {},
    connect: async () => {}
  };
} else {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
  });

  redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
    isRedisAvailable = false;
  });
  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
    isRedisAvailable = true;
  });
  redisClient.on('end', () => {
    isRedisAvailable = false;
  });
}

export const connectRedis = async () => {
  if (process.env.DISABLE_REDIS === 'true') return;
  try {
    await redisClient.connect();
    isRedisAvailable = true;
  } catch (error) {
    console.log('Redis not available, falling back to in-memory storage');
    isRedisAvailable = false;
    // We can't reassign redisClient because it's already exported, 
    // so we just override its methods to be no-ops.
    redisClient.get = async () => null;
    redisClient.setEx = async () => {};
    redisClient.del = async () => {};
    redisClient.keys = async () => [];
    redisClient.multi = () => ({ exec: async () => [] });
  }
};

export const getRedisClient = () => redisClient;
export const isRedisConnected = () => isRedisAvailable;

export default redisClient;
