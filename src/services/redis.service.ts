import Redis from 'ioredis';
import { config } from '../config/environment';
import { BestOfferHotel } from '../types/hotel.types';

export class RedisService {
  private static instance: RedisService;
  public client: Redis;

  private constructor() {
    this.client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (process.env.NODE_ENV === 'test' || times > 3) {
          return null; // Stop reconnecting in test or after 3 attempts
        }
        return Math.min(times * 100, 2000);
      },
    });

    this.client.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[Redis] Connection error:', err.message);
      }
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    if (this.client.status === 'wait' || this.client.status === 'close') {
      await this.client.connect().catch((err) => {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[Redis] Warning: Initial connect failed:', err.message);
        }
      });
    }
  }

  /**
   * Saves deduplicated hotels to a Redis Sorted Set (ZSET).
   * Key format: `hotels:<city>`
   * Score: hotel price
   * Member: JSON serialized hotel offer
   */
  public async saveHotelsToSortedSet(
    city: string,
    hotels: BestOfferHotel[],
    ttlSeconds = 600
  ): Promise<void> {
    const key = `hotels:${city.trim().toLowerCase()}`;
    const pipeline = this.client.pipeline();

    pipeline.del(key);

    if (hotels.length > 0) {
      for (const hotel of hotels) {
        pipeline.zadd(key, hotel.price, JSON.stringify(hotel));
      }
      pipeline.expire(key, ttlSeconds);
    }

    await pipeline.exec();
  }

  /**
   * Filters hotels by price range directly inside Redis using ZRANGEBYSCORE.
   * If minPrice is not specified, uses '-inf'.
   * If maxPrice is not specified, uses '+inf'.
   */
  public async filterHotelsByPrice(
    city: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<BestOfferHotel[]> {
    const key = `hotels:${city.trim().toLowerCase()}`;
    const min = minPrice !== undefined && !isNaN(minPrice) ? minPrice.toString() : '-inf';
    const max = maxPrice !== undefined && !isNaN(maxPrice) ? maxPrice.toString() : '+inf';

    const results = await this.client.zrangebyscore(key, min, max);

    return results.map((item) => JSON.parse(item) as BestOfferHotel);
  }

  /**
   * Checks Redis connection health.
   */
  public async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      this.client.disconnect();
    } catch {}
  }
}

export const redisService = RedisService.getInstance();
