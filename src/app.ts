import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { hotelsRouter } from './routes/hotels.router';
import { suppliersRouter } from './routes/suppliers.router';
import { healthRouter } from './routes/health.router';
import { swaggerSpec } from './docs/swagger.spec';

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

// Swagger API Documentation endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger', (_req: Request, res: Response) => res.redirect('/docs'));
app.get('/docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

// Serve static UI assets from public folder
const publicPath = path.resolve(__dirname, '../public');
app.use(express.static(publicPath));

// Mount business routes
app.use(suppliersRouter);
app.use('/api', hotelsRouter);
app.use(healthRouter);

// Fallback for root to serve index.html if static middleware didn't catch it
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
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
