import { deduplicateHotels } from '../src/services/deduplicator.service';
import { SupplierHotel } from '../src/types/hotel.types';

describe('Deduplicator Service', () => {
  const supplierAOffers: SupplierHotel[] = [
    { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
    { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
    { hotelId: 'a3', name: 'Taj Palace', price: 12000, city: 'delhi', commissionPct: 18 },
    { hotelId: 'a4', name: 'Marriott', price: 8500, city: 'delhi', commissionPct: 12 },
  ];

  const supplierBOffers: SupplierHotel[] = [
    { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
    { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 15 },
    { hotelId: 'b3', name: 'Taj Palace', price: 11500, city: 'delhi', commissionPct: 15 },
    { hotelId: 'b4', name: 'Hyatt', price: 7800, city: 'delhi', commissionPct: 14 },
  ];

  it('should choose the cheaper offer when a hotel is present in both suppliers', () => {
    const result = deduplicateHotels(supplierAOffers, supplierBOffers);

    // Holtin: B (5340) is cheaper than A (6000)
    const holtin = result.find((h) => h.name.toLowerCase() === 'holtin');
    expect(holtin).toBeDefined();
    expect(holtin?.price).toBe(5340);
    expect(holtin?.supplier).toBe('Supplier B');
    expect(holtin?.commissionPct).toBe(20);

    // Radison: A (5900) is cheaper than B (6200)
    const radison = result.find((h) => h.name.toLowerCase() === 'radison');
    expect(radison).toBeDefined();
    expect(radison?.price).toBe(5900);
    expect(radison?.supplier).toBe('Supplier A');
    expect(radison?.commissionPct).toBe(13);

    // Taj Palace: B (11500) is cheaper than A (12000)
    const taj = result.find((h) => h.name.toLowerCase() === 'taj palace');
    expect(taj).toBeDefined();
    expect(taj?.price).toBe(11500);
    expect(taj?.supplier).toBe('Supplier B');
  });

  it('should include hotels that appear in only one supplier', () => {
    const result = deduplicateHotels(supplierAOffers, supplierBOffers);

    // Marriott only in Supplier A
    const marriott = result.find((h) => h.name.toLowerCase() === 'marriott');
    expect(marriott).toBeDefined();
    expect(marriott?.price).toBe(8500);
    expect(marriott?.supplier).toBe('Supplier A');

    // Hyatt only in Supplier B
    const hyatt = result.find((h) => h.name.toLowerCase() === 'hyatt');
    expect(hyatt).toBeDefined();
    expect(hyatt?.price).toBe(7800);
    expect(hyatt?.supplier).toBe('Supplier B');
  });

  it('should handle case insensitivity and whitespace in hotel names', () => {
    const listA: SupplierHotel[] = [
      { hotelId: '1', name: '  Grand Hotel  ', price: 5000, city: 'delhi', commissionPct: 10 },
    ];
    const listB: SupplierHotel[] = [
      { hotelId: '2', name: 'grand hotel', price: 4500, city: 'delhi', commissionPct: 15 },
    ];

    const result = deduplicateHotels(listA, listB);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(4500);
    expect(result[0].supplier).toBe('Supplier B');
  });

  it('should return an empty array if both supplier lists are empty', () => {
    const result = deduplicateHotels([], []);
    expect(result).toEqual([]);
  });

  it('should work when only Supplier A provides hotels', () => {
    const result = deduplicateHotels(supplierAOffers, []);
    expect(result).toHaveLength(4);
    expect(result.every((h) => h.supplier === 'Supplier A')).toBe(true);
  });

  it('should work when only Supplier B provides hotels', () => {
    const result = deduplicateHotels([], supplierBOffers);
    expect(result).toHaveLength(4);
    expect(result.every((h) => h.supplier === 'Supplier B')).toBe(true);
  });
});
