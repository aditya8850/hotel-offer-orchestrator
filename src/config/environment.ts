import dotenv from 'dotenv';

dotenv.config();

const port = parseInt(process.env.PORT || '3000', 10);

export const config = {
  port,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  temporalAddress: process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233',
  temporalTaskQueue: process.env.TEMPORAL_TASK_QUEUE || 'hotel-offers-task-queue',
  supplierAUrl: process.env.SUPPLIER_A_URL || `http://127.0.0.1:${port}/supplierA/hotels`,
  supplierBUrl: process.env.SUPPLIER_B_URL || `http://127.0.0.1:${port}/supplierB/hotels`,
  nodeEnv: process.env.NODE_ENV || 'development',
};
