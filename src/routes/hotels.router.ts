import { Router, Request, Response, NextFunction } from 'express';
import { executeHotelWorkflow } from '../temporal/client';
import { redisService } from '../services/redis.service';

export const hotelsRouter = Router();

/**
 * GET /api/hotels
 * Query params:
 *   - city: string (required)
 *   - minPrice: number (optional)
 *   - maxPrice: number (optional)
 */
hotelsRouter.get('/hotels', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';

    if (!city) {
      res.status(400).json({
        error: "Query parameter 'city' is required. Example: /api/hotels?city=delhi",
      });
      return;
    }

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (req.query.minPrice !== undefined) {
      const parsedMin = Number(req.query.minPrice);
      if (isNaN(parsedMin) || parsedMin < 0) {
        res.status(400).json({ error: "Query parameter 'minPrice' must be a non-negative number" });
        return;
      }
      minPrice = parsedMin;
    }

    if (req.query.maxPrice !== undefined) {
      const parsedMax = Number(req.query.maxPrice);
      if (isNaN(parsedMax) || parsedMax < 0) {
        res.status(400).json({ error: "Query parameter 'maxPrice' must be a non-negative number" });
        return;
      }
      maxPrice = parsedMax;
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      res.status(400).json({ error: "'minPrice' cannot be greater than 'maxPrice'" });
      return;
    }

    // 1. Run Temporal workflow to orchestrate supplier fetching, comparison, and Redis caching
    await executeHotelWorkflow(city);

    // 2. Perform price filtering directly inside Redis using Sorted Set range query (ZRANGEBYSCORE)
    const filteredHotels = await redisService.filterHotelsByPrice(city, minPrice, maxPrice);

    res.json(filteredHotels);
  } catch (error: any) {
    console.error('[Hotels API] Error handling request:', error);
    next(error);
  }
});
