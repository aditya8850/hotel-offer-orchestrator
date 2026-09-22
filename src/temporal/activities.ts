import { config } from '../config/environment';
import { SupplierHotel, BestOfferHotel } from '../types/hotel.types';
import { redisService } from '../services/redis.service';

/**
 * Activity: Calls Mock Supplier A to fetch hotel listings for a city.
 */
export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  const url = `${config.supplierAUrl}?city=${encodeURIComponent(city)}`;
  console.log(`[Activity: fetchSupplierA] Calling ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Supplier A returned HTTP ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json()) as SupplierHotel[];
    console.log(`[Activity: fetchSupplierA] Received ${data.length} hotels for city: ${city}`);
    return data;
  } catch (error: any) {
    console.error(`[Activity: fetchSupplierA] Failed: ${error.message}`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Activity: Calls Mock Supplier B to fetch hotel listings for a city.
 */
export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  const url = `${config.supplierBUrl}?city=${encodeURIComponent(city)}`;
  console.log(`[Activity: fetchSupplierB] Calling ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Supplier B returned HTTP ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json()) as SupplierHotel[];
    console.log(`[Activity: fetchSupplierB] Received ${data.length} hotels for city: ${city}`);
    return data;
  } catch (error: any) {
    console.error(`[Activity: fetchSupplierB] Failed: ${error.message}`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Activity: Persists the deduplicated best-offer hotels to Redis Sorted Set.
 */
export async function saveDeduplicatedHotelsToRedis(
  city: string,
  hotels: BestOfferHotel[]
): Promise<void> {
  console.log(`[Activity: saveDeduplicatedHotelsToRedis] Storing ${hotels.length} hotels for ${city} in Redis`);
  await redisService.saveHotelsToSortedSet(city, hotels);
}
