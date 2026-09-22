import { Connection, Client } from '@temporalio/client';
import { config } from '../config/environment';
import { aggregateHotelOffersWorkflow } from './workflows';
import { BestOfferHotel } from '../types/hotel.types';

let clientInstance: Client | null = null;
let connectionInstance: Connection | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (clientInstance) {
    return clientInstance;
  }

  connectionInstance = await Connection.connect({
    address: config.temporalAddress,
    connectTimeout: 2000,
  });

  clientInstance = new Client({
    connection: connectionInstance,
  });

  return clientInstance;
}

export async function checkTemporalHealth(): Promise<boolean> {
  try {
    const connection = await Connection.connect({
      address: config.temporalAddress,
      connectTimeout: 1000,
    });
    const client = new Client({ connection });
    await client.workflowService.getSystemInfo({});
    await connection.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Starts and awaits the aggregateHotelOffersWorkflow.
 */
export async function executeHotelWorkflow(city: string): Promise<BestOfferHotel[]> {
  const client = await getTemporalClient();
  const workflowId = `hotel-agg-${city.toLowerCase()}-${Date.now()}`;

  const handle = await client.workflow.start(aggregateHotelOffersWorkflow, {
    taskQueue: config.temporalTaskQueue,
    args: [{ city }],
    workflowId,
  });

  return await handle.result();
}
