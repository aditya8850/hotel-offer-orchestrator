# Hotel Offer Orchestrator

A backend system that aggregates overlapping hotel listings from two suppliers, deduplicates them by selecting the cheapest offer, saves them to Redis, and allows filtering by price range. Orchestration is managed using Temporal workflows.

---

## What This System Does

When a user searches for hotels in a city (for example, Delhi):
1. **Temporal Workflow**: Triggers parallel requests to Supplier A and Supplier B.
2. **Deduplication**: If a hotel appears in both suppliers (like "Holtin"), it picks the cheaper one. If it only appears in one supplier, it includes it.
3. **Redis Caching**: The deduplicated list is saved into a **Redis Sorted Set** (a Redis data structure that stores items ordered by a number, in this case, hotel price).
4. **Price Range Filtering**: If `minPrice` or `maxPrice` query parameters are provided, Redis directly filters the hotels using the `ZRANGEBYSCORE` command.
5. **Response**: Returns the final best-priced hotels to the user.

---

## Tech Stack

- **Node.js (v20+) & TypeScript**: Application language and runtime.
- **Express**: HTTP web server framework for REST endpoints.
- **Temporal.io**: Workflow engine that runs activities reliably with automatic retries.
- **Redis (ioredis)**: In-memory database used for caching and price range filtering.
- **Docker & Docker Compose**: Containerization to run the entire stack with one command.
- **Jest & Supertest**: Unit and integration test suite.

---

## Project Structure

```text
hotel-offer-orchestrator/
├── src/
│   ├── app.ts                     # Express app setup and middleware
│   ├── index.ts                   # Main server entrypoint
│   ├── config/
│   │   └── environment.ts         # Environment variable configuration
│   ├── routes/
│   │   ├── hotels.router.ts       # GET /api/hotels (with Redis price filtering)
│   │   ├── suppliers.router.ts    # Mock Supplier A and B endpoints
│   │   └── health.router.ts       # GET /health (bonus health status)
│   ├── services/
│   │   ├── deduplicator.service.ts# Pure deduplication logic
│   │   └── redis.service.ts       # Redis Sorted Set operations
│   ├── temporal/
│   │   ├── activities.ts          # Temporal activities (HTTP calls, Redis save)
│   │   ├── workflows.ts           # Temporal workflow orchestration
│   │   ├── worker.ts              # Temporal worker process
│   │   └── client.ts              # Temporal client connection
│   └── types/
│       └── hotel.types.ts         # TypeScript interfaces
├── tests/
│   ├── api.test.ts                # Express API integration tests
│   ├── deduplicator.test.ts       # Deduplication logic unit tests
│   └── redis.test.ts              # Redis price filtering tests
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Full stack orchestration (App, Worker, Redis, Temporal)
├── Hotel_Offer_Orchestrator.postman_collection.json # Postman collection
├── package.json
└── tsconfig.json
```

---

## Quick Start with Docker Compose (Recommended)

To run the entire system (Express API, Temporal Server, Temporal Web UI, Temporal Worker, and Redis):

```bash
# 1. Navigate to the project directory
cd hotel-offer-orchestrator

# 2. Start all services in the background
docker compose up --build -d
```

Once running:
- **API Server**: `http://localhost:3000`
- **Temporal Web UI**: `http://localhost:8233`
- **Redis**: `localhost:6379`

To view logs:
```bash
docker compose logs -f api
```

To stop all services:
```bash
docker compose down
```

---

## Running Locally for Development

If you prefer running without Docker:

### Prerequisites
- Node.js v20+ and npm installed
- Redis running locally on port `6379`
- Temporal dev server running locally on port `7233` (e.g., via `temporal server start-dev`)

### Steps
```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start the API server in dev mode
npm run dev

# 4. Start the Temporal worker in a separate terminal
npm run worker
```

---

## API Endpoints

### 0. Interactive Web Dashboard & Swagger UI

- **Interactive Dashboard**: Open `/` in your browser to search hotels, test price range filtering, view system health, and toggle simulated supplier outages with visual cards.
- **Swagger Documentation**: Open `/docs` (or `/swagger`) in your browser to test and inspect all API endpoints interactively.
- **OpenAPI JSON**: Available at `/docs.json`.

---

### 1. Get Aggregated & Deduplicated Hotels
- **URL**: `GET /api/hotels`
- **Query Parameters**:
  - `city` *(required)*: Name of the city (e.g. `delhi`, `mumbai`)
  - `minPrice` *(optional)*: Minimum price filter (e.g. `5500`)
  - `maxPrice` *(optional)*: Maximum price filter (e.g. `8000`)

#### Example Request:
```bash
curl "http://localhost:3000/api/hotels?city=delhi"
```

#### Example Response:
```json
[
  {
    "name": "Holtin",
    "price": 5340,
    "supplier": "Supplier B",
    "commissionPct": 20
  },
  {
    "name": "Radison",
    "price": 5900,
    "supplier": "Supplier A",
    "commissionPct": 13
  },
  {
    "name": "Hyatt",
    "price": 7800,
    "supplier": "Supplier B",
    "commissionPct": 14
  },
  {
    "name": "Marriott",
    "price": 8500,
    "supplier": "Supplier A",
    "commissionPct": 12
  },
  {
    "name": "Taj Palace",
    "price": 11500,
    "supplier": "Supplier B",
    "commissionPct": 15
  }
]
```

#### Example with Price Range Filtering:
```bash
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=5500&maxPrice=8000"
```
**Response:**
```json
[
  {
    "name": "Radison",
    "price": 5900,
    "supplier": "Supplier A",
    "commissionPct": 13
  },
  {
    "name": "Hyatt",
    "price": 7800,
    "supplier": "Supplier B",
    "commissionPct": 14
  }
]
```

---

### 2. Mock Supplier Endpoints

#### Supplier A
- **URL**: `GET /supplierA/hotels?city=delhi`
- Supports `?simulateDown=true` to simulate a supplier outage.

#### Supplier B
- **URL**: `GET /supplierB/hotels?city=delhi`
- Supports `?simulateDown=true` to simulate a supplier outage.

---

### 3. Health Check Endpoint (Bonus Requirement)
- **URL**: `GET /health`
- Reports the connection status of Redis, Temporal, and response latency of both Supplier A and Supplier B.

#### Example Response:
```json
{
  "status": "UP",
  "timestamp": "2026-09-22T08:15:00.000Z",
  "services": {
    "redis": "UP",
    "temporal": "UP",
    "suppliers": {
      "supplierA": {
        "status": "UP",
        "responseTimeMs": 12
      },
      "supplierB": {
        "status": "UP",
        "responseTimeMs": 14
      }
    }
  }
}
```

---

## How Price Filtering in Redis Works

We use Redis **Sorted Sets** (ZSET) to store hotel offers:
1. When a deduplicated list is generated, each hotel is added to the key `hotels:<city>` with `ZADD hotels:<city> <price> <hotelJson>`.
2. When the user requests a price filter (e.g. `minPrice=5500&maxPrice=8000`), the query executes:
   ```redis
   ZRANGEBYSCORE hotels:delhi 5500 8000
   ```
3. Redis returns only the matching hotels ordered by price directly from memory.

---

## Running Automated Tests

Run the test suite with:

```bash
npm test
```

To run tests with code coverage:

```bash
npm run test:coverage
```

The test suite covers:
- **Deduplication Logic**: Cheaper price selection, single-supplier hotels, case insensitivity.
- **Price Range Filtering**: Min and max boundaries, edge cases.
- **API Endpoints**: Validation errors, mock supplier responses, error simulations.

---

## Postman Collection

Import `Hotel_Offer_Orchestrator.postman_collection.json` into Postman to test:
1. Overlapping hotels for Delhi
2. Price range filtering (`minPrice` and `maxPrice`)
3. City with no results (`atlantis`)
4. Missing city parameter validation error
5. Supplier A direct endpoint
6. Supplier B direct endpoint
7. Supplier outage simulation (`simulateDown=true`)
8. Detailed health check
