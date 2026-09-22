import { app } from './app';
import { config } from './config/environment';
import { redisService } from './services/redis.service';
import { runWorker } from './temporal/worker';

async function bootstrap() {
  console.log(`[Bootstrap] Starting Hotel Offer Orchestrator in ${config.nodeEnv} mode...`);

  // Connect to Redis
  await redisService.connect();
  console.log(`[Bootstrap] Connected to Redis at ${config.redisUrl}`);

  // Start HTTP server
  const server = app.listen(config.port, () => {
    console.log(`[Bootstrap] HTTP Server listening on http://localhost:${config.port}`);
  });

  // If running in development or standalone mode, optionally start the Temporal worker in the same process
  if (process.env.START_WORKER !== 'false') {
    runWorker().catch((err) => {
      console.warn(
        `[Bootstrap] Warning: Could not connect embedded Temporal worker to ${config.temporalAddress} (${err.message}). Worker will be ready when Temporal starts.`
      );
    });
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Received ${signal}, closing server gracefully...`);
    server.close(async () => {
      await redisService.disconnect();
      console.log('[Shutdown] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal startup error:', err);
  process.exit(1);
});
