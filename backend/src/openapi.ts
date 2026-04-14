export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TradeDesk API',
    version: '1.0.0',
    description:
      'Production-grade REST API for authenticated trade order management. Built on Cloudflare Workers with Hono.js, D1, and KV.',
  },
  servers: [
    { url: 'https://tradedesk-api.your-subdomain.workers.dev', description: 'Production' },
    { url: 'http://localhost:8787', description: 'Local development' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/v1/auth/login or /api/v1/auth/register',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'a3f1c8d2e9b04e5f' },
          email: { type: 'string', format: 'email', example: 'trader@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          created_at: { type: 'integer', example: 1700000000 },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'b7e2d1f4a8c3e6f9' },
          user_id: { type: 'string', example: 'a3f1c8d2e9b04e5f' },
          symbol: { type: 'string', example: 'BTC/USDT' },
          side: { type: 'string', enum: ['BUY', 'SELL'], example: 'BUY' },
          order_type: { type: 'string', enum: ['MARKET', 'LIMIT'], example: 'LIMIT' },
          quantity: { type: 'number', example: 0.5 },
          price: { type: 'number', nullable: true, example: 65000.0 },
          status: {
            type: 'string',
            enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'],
            example: 'PENDING',
          },
          created_at: { type: 'integer', example: 1700000000 },
          updated_at: { type: 'integer', example: 1700000100 },
        },
      },
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 100 },
            },
          },
        },
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'UNAUTHORIZED',
                  'FORBIDDEN',
                  'NOT_FOUND',
                  'CONFLICT',
                  'RATE_LIMITED',
                  'UNPROCESSABLE',
                  'INTERNAL',
                ],
              },
              message: { type: 'string', example: 'Invalid credentials' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'trader@example.com' },
                  password: { type: 'string', minLength: 8, example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        data: {
                          properties: {
                            token: { type: 'string', example: 'eyJhbGci...' },
                            user: { $ref: '#/components/schemas/User' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'trader@example.com' },
                  password: { type: 'string', example: 'Secure123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout — blacklist current JWT',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
    '/api/v1/orders': {
      get: {
        tags: ['Orders'],
        summary: "Get caller's orders (paginated)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Paginated orders list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create a new order',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symbol', 'side', 'order_type', 'quantity'],
                properties: {
                  symbol: { type: 'string', example: 'BTC/USDT' },
                  side: { type: 'string', enum: ['BUY', 'SELL'] },
                  order_type: { type: 'string', enum: ['MARKET', 'LIMIT'] },
                  quantity: { type: 'number', minimum: 0, exclusiveMinimum: true, example: 0.5 },
                  price: { type: 'number', example: 65000.0 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Order created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '429': { description: 'Rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
    '/api/v1/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get a single order by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Order details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
    '/api/v1/orders/{id}/cancel': {
      patch: {
        tags: ['Orders'],
        summary: 'Cancel a PENDING order',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Order cancelled' },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          '422': { description: 'Invalid state transition', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
    '/api/v1/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'Get all orders across all users (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'] } },
          { name: 'user_id', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'All orders with pagination' },
          '403': { description: 'Admin role required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
        },
      },
    },
    '/api/v1/admin/orders/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Update order status (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['EXECUTED', 'CANCELLED', 'REJECTED'] },
                  reason: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Order status updated' },
          '403': { description: 'Admin role required' },
          '404': { description: 'Order not found' },
          '422': { description: 'Invalid state transition' },
        },
      },
    },
    '/api/v1/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Get all users (admin)',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'List of all users (no password hashes)' },
          '403': { description: 'Admin role required' },
        },
      },
    },
    '/api/v1/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User deleted' },
          '400': { description: 'Cannot delete own account' },
          '403': { description: 'Admin role required' },
          '404': { description: 'User not found' },
        },
      },
    },
  },
} as const;

export function generateSwaggerHTML(spec: object): string {
  const specJson = JSON.stringify(spec);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TradeDesk API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #080810; }
    .swagger-ui { background: #080810; }
    .swagger-ui .topbar { background: #0f0f1a; border-bottom: 1px solid #1e1e2e; }
    .swagger-ui .topbar-wrapper .link { display: flex; align-items: center; }
    .swagger-ui .topbar-wrapper .link::before {
      content: 'TRADEDESK API'; color: #f5a623;
      font-family: 'JetBrains Mono', monospace; font-size: 14px;
      font-weight: 600; letter-spacing: 0.2em;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${specJson},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
    });
  </script>
</body>
</html>`;
}
