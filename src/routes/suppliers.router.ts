import { Router, Request, Response } from 'express';
import { SupplierHotel } from '../types/hotel.types';

export const suppliersRouter = Router();

// In-memory mock datasets
const mockDataA: Record<string, SupplierHotel[]> = {
  delhi: [
    { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
    { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
    { hotelId: 'a3', name: 'Taj Palace', price: 12000, city: 'delhi', commissionPct: 18 },
    { hotelId: 'a4', name: 'Marriott', price: 8500, city: 'delhi', commissionPct: 12 },
  ],
  mumbai: [
    { hotelId: 'a5', name: 'Trident', price: 9200, city: 'mumbai', commissionPct: 11 },
    { hotelId: 'a6', name: 'The Leela', price: 10500, city: 'mumbai', commissionPct: 14 },
  ],
};

const mockDataB: Record<string, SupplierHotel[]> = {
  delhi: [
    { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
    { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 15 },
    { hotelId: 'b3', name: 'Taj Palace', price: 11500, city: 'delhi', commissionPct: 15 },
    { hotelId: 'b4', name: 'Hyatt', price: 7800, city: 'delhi', commissionPct: 14 },
  ],
  mumbai: [
    { hotelId: 'b5', name: 'Trident', price: 8900, city: 'mumbai', commissionPct: 16 },
    { hotelId: 'b6', name: 'The Leela', price: 11200, city: 'mumbai', commissionPct: 12 },
  ],
};

// Global toggle for simulating persistent downtime if desired
let supplierADown = false;
let supplierBDown = false;

/**
 * GET /supplierA/hotels
 */
suppliersRouter.get('/supplierA/hotels', (req: Request, res: Response): void => {
  const simulateDown = req.query.simulateDown === 'true' || supplierADown;
  if (simulateDown) {
    res.status(503).json({ error: 'Supplier A is currently unavailable' });
    return;
  }

  const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : '';
  if (!city) {
    res.status(400).json({ error: 'City query parameter is required' });
    return;
  }

  const hotels = mockDataA[city] || [];
  res.json(hotels);
});

/**
 * GET /supplierB/hotels
 */
suppliersRouter.get('/supplierB/hotels', (req: Request, res: Response): void => {
  const simulateDown = req.query.simulateDown === 'true' || supplierBDown;
  if (simulateDown) {
    res.status(503).json({ error: 'Supplier B is currently unavailable' });
    return;
  }

  const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : '';
  if (!city) {
    res.status(400).json({ error: 'City query parameter is required' });
    return;
  }

  const hotels = mockDataB[city] || [];
  res.json(hotels);
});

/**
 * POST /suppliers/simulate - Optional route to toggle supplier health for testing
 */
suppliersRouter.post('/suppliers/simulate', (req: Request, res: Response): void => {
  if (typeof req.body.supplierADown === 'boolean') {
    supplierADown = req.body.supplierADown;
  }
  if (typeof req.body.supplierBDown === 'boolean') {
    supplierBDown = req.body.supplierBDown;
  }

  res.json({
    message: 'Simulation status updated',
    supplierADown,
    supplierBDown,
  });
});
