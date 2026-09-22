import { SupplierHotel, BestOfferHotel } from '../types/hotel.types';

/**
 * Deduplicates hotel offers from two suppliers by hotel name.
 * For hotels present in both suppliers, it selects the cheaper price.
 * For hotels present in only one supplier, it includes that offer.
 */
export function deduplicateHotels(
  hotelsA: SupplierHotel[] = [],
  hotelsB: SupplierHotel[] = []
): BestOfferHotel[] {
  const offerMap = new Map<
    string,
    { originalName: string; price: number; supplier: string; commissionPct: number }
  >();

  // Process Supplier A offers
  for (const item of hotelsA) {
    if (!item || !item.name || typeof item.price !== 'number') continue;
    const key = item.name.trim().toLowerCase();
    offerMap.set(key, {
      originalName: item.name.trim(),
      price: item.price,
      supplier: 'Supplier A',
      commissionPct: item.commissionPct,
    });
  }

  // Process Supplier B offers and compare
  for (const item of hotelsB) {
    if (!item || !item.name || typeof item.price !== 'number') continue;
    const key = item.name.trim().toLowerCase();
    const existing = offerMap.get(key);

    if (!existing) {
      offerMap.set(key, {
        originalName: item.name.trim(),
        price: item.price,
        supplier: 'Supplier B',
        commissionPct: item.commissionPct,
      });
    } else {
      // If Supplier B is cheaper, replace with Supplier B
      if (item.price < existing.price) {
        offerMap.set(key, {
          originalName: existing.originalName,
          price: item.price,
          supplier: 'Supplier B',
          commissionPct: item.commissionPct,
        });
      }
    }
  }

  // Convert map to array in consistent format
  const result: BestOfferHotel[] = [];
  for (const value of offerMap.values()) {
    result.push({
      name: value.originalName,
      price: value.price,
      supplier: value.supplier,
      commissionPct: value.commissionPct,
    });
  }

  return result;
}
