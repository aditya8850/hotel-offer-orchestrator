import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { SupplierHotel, BestOfferHotel } from '../types/hotel.types';

// Configure activities with timeouts and retry policies
const { fetchSupplierA, fetchSupplierB, saveDeduplicatedHotelsToRedis } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 seconds',
    retry: {
      initialInterval: '500 milliseconds',
      maximumInterval: '2 seconds',
      maximumAttempts: 3,
      backoffCoefficient: 2,
    },
  });

/**
 * Deterministic helper to deduplicate hotel listings.
 * For hotels appearing in both lists, the cheaper price is selected.
 */
function deduplicate(
  hotelsA: SupplierHotel[] = [],
  hotelsB: SupplierHotel[] = []
): BestOfferHotel[] {
  const map = new Map<
    string,
    { name: string; price: number; supplier: string; commissionPct: number }
  >();

  // Process Supplier A
  for (const h of hotelsA) {
    if (!h || !h.name || typeof h.price !== 'number') continue;
    const key = h.name.trim().toLowerCase();
    map.set(key, {
      name: h.name.trim(),
      price: h.price,
      supplier: 'Supplier A',
      commissionPct: h.commissionPct,
    });
  }

  // Process Supplier B
  for (const h of hotelsB) {
    if (!h || !h.name || typeof h.price !== 'number') continue;
    const key = h.name.trim().toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        name: h.name.trim(),
        price: h.price,
        supplier: 'Supplier B',
        commissionPct: h.commissionPct,
      });
    } else if (h.price < existing.price) {
      // Supplier B has lower price
      map.set(key, {
        name: existing.name,
        price: h.price,
        supplier: 'Supplier B',
        commissionPct: h.commissionPct,
      });
    }
  }

  const result: BestOfferHotel[] = [];
  for (const item of map.values()) {
    result.push({
      name: item.name,
      price: item.price,
      supplier: item.supplier,
      commissionPct: item.commissionPct,
    });
  }

  return result;
}

/**
 * Temporal Workflow: Orchestrates fetching hotel offers from Supplier A and B in parallel,
 * deduplicates them to select the cheapest offer, saves them to Redis, and returns the result.
 */
export async function aggregateHotelOffersWorkflow(input: {
  city: string;
}): Promise<BestOfferHotel[]> {
  const { city } = input;

  // Run activity calls in parallel using Promise.allSettled for fault tolerance
  const [resultA, resultB] = await Promise.allSettled([
    fetchSupplierA(city),
    fetchSupplierB(city),
  ]);

  const hotelsA: SupplierHotel[] =
    resultA.status === 'fulfilled' ? resultA.value : [];
  const hotelsB: SupplierHotel[] =
    resultB.status === 'fulfilled' ? resultB.value : [];

  // Deduplicate and choose best price
  const deduplicated = deduplicate(hotelsA, hotelsB);

  // Save deduplicated hotels to Redis via activity
  if (deduplicated.length > 0) {
    await saveDeduplicatedHotelsToRedis(city, deduplicated);
  }

  return deduplicated;
}
