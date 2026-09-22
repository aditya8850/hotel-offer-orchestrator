import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { hotelsRouter } from './routes/hotels.router';
import { suppliersRouter } from './routes/suppliers.router';
import { healthRouter } from './routes/health.router';

export const app = express();

app.use(cors());
app.use(express.json());

// Request logger for visibility
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${method} ${originalUrl} ${_res.statusCode} - ${duration}ms`);
  });
  next();
});

// Mount routes
app.use(suppliersRouter);
app.use('/api', hotelsRouter);
app.use(healthRouter);

// Root greeting / info endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Hotel Offer Orchestrator API',
    status: 'running',
    endpoints: {
      hotels: '/api/hotels?city=delhi&minPrice=5000&maxPrice=8000',
      supplierA: '/supplierA/hotels?city=delhi',
      supplierB: '/supplierB/hotels?city=delhi',
      health: '/health',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error Handler] Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});
