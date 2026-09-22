export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hotel Offer Orchestrator API',
    version: '1.0.0',
    description:
      'API that aggregates overlapping hotel listings from two suppliers, deduplicates offers by lowest price using Temporal.io workflows, and filters prices inside Redis Sorted Sets.',
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment Server',
    },
  ],
  paths: {
    '/api/hotels': {
      get: {
        summary: 'Search & Deduplicate Hotels',
        description:
          'Triggers a Temporal workflow to fetch hotels from Supplier A and B in parallel, deduplicates by hotel name picking the cheaper price, saves into Redis, and returns results filtered by price.',
        parameters: [
          {
            name: 'city',
            in: 'query',
            required: true,
            description: 'Name of the city (e.g. delhi, mumbai)',
            schema: {
              type: 'string',
              example: 'delhi',
            },
          },
          {
            name: 'minPrice',
            in: 'query',
            required: false,
            description: 'Minimum price filter (processed in Redis)',
            schema: {
              type: 'number',
              example: 5500,
            },
          },
          {
            name: 'maxPrice',
            in: 'query',
            required: false,
            description: 'Maximum price filter (processed in Redis)',
            schema: {
              type: 'number',
              example: 8000,
            },
          },
        ],
        responses: {
          200: {
            description: 'De-duplicated list of best hotel offers',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Holtin' },
                      price: { type: 'number', example: 5340 },
                      supplier: { type: 'string', example: 'Supplier B' },
                      commissionPct: { type: 'number', example: 20 },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error (e.g. missing city or invalid price range)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: "Query parameter 'city' is required" },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'System Health Check',
        description:
          'Reports real-time connectivity status of Redis, Temporal server, and response latency of Mock Supplier A and Supplier B.',
        responses: {
          200: {
            description: 'System is healthy',
          },
          503: {
            description: 'One or more essential services are down',
          },
        },
      },
    },
    '/supplierA/hotels': {
      get: {
        summary: 'Mock Supplier A Endpoint',
        parameters: [
          {
            name: 'city',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'delhi' },
          },
          {
            name: 'simulateDown',
            in: 'query',
            required: false,
            schema: { type: 'boolean', example: false },
          },
        ],
        responses: {
          200: { description: 'List of hotel listings from Supplier A' },
          503: { description: 'Simulated supplier downtime' },
        },
      },
    },
    '/supplierB/hotels': {
      get: {
        summary: 'Mock Supplier B Endpoint',
        parameters: [
          {
            name: 'city',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'delhi' },
          },
          {
            name: 'simulateDown',
            in: 'query',
            required: false,
            schema: { type: 'boolean', example: false },
          },
        ],
        responses: {
          200: { description: 'List of hotel listings from Supplier B' },
          503: { description: 'Simulated supplier downtime' },
        },
      },
    },
    '/suppliers/simulate': {
      post: {
        summary: 'Simulate Supplier Downtime',
        description: 'Toggles mock supplier downtime to test workflow fault-tolerance.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  supplierADown: { type: 'boolean' },
                  supplierBDown: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Simulation settings updated' },
        },
      },
    },
  },
};
