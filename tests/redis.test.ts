import { BestOfferHotel } from '../src/types/hotel.types';

describe('Redis Price Range Filtering Logic', () => {
  const sampleHotels: BestOfferHotel[] = [
    { name: 'Holtin', price: 5340, supplier: 'Supplier B', commissionPct: 20 },
    { name: 'Radison', price: 5900, supplier: 'Supplier A', commissionPct: 13 },
    { name: 'Hyatt', price: 7800, supplier: 'Supplier B', commissionPct: 14 },
    { name: 'Marriott', price: 8500, supplier: 'Supplier A', commissionPct: 12 },
    { name: 'Taj Palace', price: 11500, supplier: 'Supplier B', commissionPct: 15 },
  ];

  // Simulates the behavior of Redis ZRANGEBYSCORE min max
  function simulateRedisZRangeByScore(
    hotels: BestOfferHotel[],
    minPrice?: number,
    maxPrice?: number
  ): BestOfferHotel[] {
    const min = minPrice !== undefined ? minPrice : -Infinity;
    const max = maxPrice !== undefined ? maxPrice : Infinity;

    return hotels.filter((h) => h.price >= min && h.price <= max);
  }

  it('should return all hotels when minPrice and maxPrice are undefined', () => {
    const filtered = simulateRedisZRangeByScore(sampleHotels);
    expect(filtered).toHaveLength(5);
  });

  it('should filter hotels with only minPrice specified', () => {
    const filtered = simulateRedisZRangeByScore(sampleHotels, 8000);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((h) => h.name)).toEqual(['Marriott', 'Taj Palace']);
  });

  it('should filter hotels with only maxPrice specified', () => {
    const filtered = simulateRedisZRangeByScore(sampleHotels, undefined, 6000);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((h) => h.name)).toEqual(['Holtin', 'Radison']);
  });

  it('should filter hotels between minPrice and maxPrice', () => {
    const filtered = simulateRedisZRangeByScore(sampleHotels, 5500, 8000);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((h) => h.name)).toEqual(['Radison', 'Hyatt']);
  });

  it('should return empty list when no hotels fall within range', () => {
    const filtered = simulateRedisZRangeByScore(sampleHotels, 20000, 30000);
    expect(filtered).toHaveLength(0);
  });
});
