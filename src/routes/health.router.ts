import { Router, Request, Response } from 'express';
import { redisService } from '../services/redis.service';
import { checkTemporalHealth } from '../temporal/client';
import { config } from '../config/environment';
import { HealthReport, SupplierHealthStatus } from '../types/hotel.types';

export const healthRouter = Router();

async function checkSupplier(url: string): Promise<SupplierHealthStatus> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${url}?city=delhi`, { signal: controller.signal });
    const responseTimeMs = Date.now() - start;
    if (res.ok) {
      return { status: 'UP', responseTimeMs };
    }
    return {
      status: 'DOWN',
      responseTimeMs,
      error: `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      status: 'DOWN',
      responseTimeMs: Date.now() - start,
      error: err.message,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GET /health
 * Informs about the health of Redis, Temporal, and both mock suppliers.
 */
healthRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const [redisUp, temporalUp, supplierAStatus, supplierBStatus] = await Promise.all([
    redisService.ping(),
    checkTemporalHealth(),
    checkSupplier(config.supplierAUrl),
    checkSupplier(config.supplierBUrl),
  ]);

  const isDegraded =
    supplierAStatus.status === 'DOWN' || supplierBStatus.status === 'DOWN';
  const isDown = !redisUp || !temporalUp;

  const overallStatus = isDown ? 'DOWN' : isDegraded ? 'DEGRADED' : 'UP';

  const report: HealthReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      redis: redisUp ? 'UP' : 'DOWN',
      temporal: temporalUp ? 'UP' : 'DOWN',
      suppliers: {
        supplierA: supplierAStatus,
        supplierB: supplierBStatus,
      },
    },
  };

  const httpStatus = overallStatus === 'DOWN' ? 503 : 200;
  res.status(httpStatus).json(report);
});
