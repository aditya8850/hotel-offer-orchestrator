import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  temporalTaskQueue: process.env.TEMPORAL_TASK_QUEUE || 'hotel-offers-task-queue',
  supplierAUrl: process.env.SUPPLIER_A_URL || 'http://localhost:3000/supplierA/hotels',
  supplierBUrl: process.env.SUPPLIER_B_URL || 'http://localhost:3000/supplierB/hotels',
  nodeEnv: process.env.NODE_ENV || 'development',
};
