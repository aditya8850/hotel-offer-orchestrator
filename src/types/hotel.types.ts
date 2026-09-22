export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface BestOfferHotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface HotelFilterQuery {
  city?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface SupplierHealthStatus {
  status: 'UP' | 'DOWN';
  responseTimeMs?: number;
  error?: string;
}

export interface HealthReport {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  services: {
    redis: 'UP' | 'DOWN';
    temporal: 'UP' | 'DOWN';
    suppliers: {
      supplierA: SupplierHealthStatus;
      supplierB: SupplierHealthStatus;
    };
  };
}
