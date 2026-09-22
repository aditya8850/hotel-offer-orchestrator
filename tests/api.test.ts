import request from 'supertest';
import { app } from '../src/app';
import { redisService } from '../src/services/redis.service';

describe('API Routes', () => {
  afterAll(async () => {
    await redisService.disconnect();
  });

  describe('Mock Supplier Endpoints', () => {
    it('GET /supplierA/hotels should return hotels for delhi', async () => {
      const res = await request(app).get('/supplierA/hotels?city=delhi');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('hotelId');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
    });

    it('GET /supplierB/hotels should return hotels for delhi', async () => {
      const res = await request(app).get('/supplierB/hotels?city=delhi');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('hotelId');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
    });

    it('GET /supplierA/hotels should return 400 when city is missing', async () => {
      const res = await request(app).get('/supplierA/hotels');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('GET /supplierA/hotels should simulate 503 error when simulateDown=true', async () => {
      const res = await request(app).get('/supplierA/hotels?city=delhi&simulateDown=true');
      expect(res.status).toBe(503);
      expect(res.body.error).toContain('unavailable');
    });

    it('GET /supplierB/hotels should simulate 503 error when simulateDown=true', async () => {
      const res = await request(app).get('/supplierB/hotels?city=delhi&simulateDown=true');
      expect(res.status).toBe(503);
      expect(res.body.error).toContain('unavailable');
    });

    it('GET /supplierA/hotels should return empty array for unknown city', async () => {
      const res = await request(app).get('/supplierA/hotels?city=unknowncity123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('Hotels Endpoint Validation', () => {
    it('GET /api/hotels without city should return 400 Bad Request', async () => {
      const res = await request(app).get('/api/hotels');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Query parameter 'city' is required");
    });

    it('GET /api/hotels with negative minPrice should return 400 Bad Request', async () => {
      const res = await request(app).get('/api/hotels?city=delhi&minPrice=-50');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("'minPrice' must be a non-negative number");
    });

    it('GET /api/hotels with minPrice > maxPrice should return 400 Bad Request', async () => {
      const res = await request(app).get('/api/hotels?city=delhi&minPrice=9000&maxPrice=5000');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("'minPrice' cannot be greater than 'maxPrice'");
    });
  });

  describe('Health Check Endpoint', () => {
    it('GET /health should return status and inform about both suppliers', async () => {
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('services');
      expect(res.body.services).toHaveProperty('suppliers');
      expect(res.body.services.suppliers).toHaveProperty('supplierA');
      expect(res.body.services.suppliers).toHaveProperty('supplierB');
      expect(res.body.services.suppliers.supplierA).toHaveProperty('status');
      expect(res.body.services.suppliers.supplierB).toHaveProperty('status');
    });
  });

  describe('Root UI and Swagger Endpoints', () => {
    it('GET / should serve the Web UI dashboard HTML', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Hotel Offer Orchestrator');
    });

    it('GET /docs.json should return OpenAPI 3.0 specification', async () => {
      const res = await request(app).get('/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info.title).toContain('Hotel Offer Orchestrator');
    });

    it('GET /docs should serve Swagger UI', async () => {
      const res = await request(app).get('/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger');
    });
  });
});
