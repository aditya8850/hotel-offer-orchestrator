import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { config } from '../config/environment';
import { redisService } from '../services/redis.service';

export async function runWorker(): Promise<Worker> {
  // Ensure Redis is connected for activities
  await redisService.connect();

  const connection = await NativeConnection.connect({
    address: config.temporalAddress,
  });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: config.temporalTaskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  console.log(`[Worker] Temporal worker running on task queue: ${config.temporalTaskQueue}`);
  await worker.run();
  return worker;
}

// Auto-run if executed directly as entrypoint
if (require.main === module) {
  runWorker().catch((err) => {
    console.error('[Worker] Fatal error in Temporal worker:', err);
    process.exit(1);
  });
}
