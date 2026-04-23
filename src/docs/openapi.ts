export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Smart Logistics API",
    version: "1.0.0"
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/health": {
      get: {
        responses: {
          "200": { description: "API is healthy" }
        }
      }
    },
    "/auth/token": {
      post: {
        summary: "Issue a JWT access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "JWT issued" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/warehouses": {
      post: {
        security: [{ bearerAuth: [] }],
        summary: "Create a warehouse",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "location", "maxCapacity", "type"],
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  maxCapacity: { type: "integer", minimum: 1 },
                  type: { type: "string", enum: ["STANDARD", "COLD"] }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Warehouse created" },
          "422": { description: "Validation error" }
        }
      },
      get: {
        security: [{ bearerAuth: [] }],
        summary: "List active warehouses",
        responses: {
          "200": { description: "Warehouse list" }
        }
      }
    },
    "/items": {
      post: {
        security: [{ bearerAuth: [] }],
        summary: "Create an item",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "sku", "storageRequirement"],
                properties: {
                  name: { type: "string" },
                  sku: { type: "string", pattern: "^[A-Z]{3}-\\d{5}-[A-Z]$" },
                  storageRequirement: { type: "string", enum: ["STANDARD", "COLD"] }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Item created" },
          "422": { description: "Validation error" }
        }
      },
      get: {
        security: [{ bearerAuth: [] }],
        summary: "List active items",
        responses: {
          "200": { description: "Item list" }
        }
      }
    },
    "/inventory/add": {
      post: {
        security: [{ bearerAuth: [] }],
        summary: "Add stock to a warehouse",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["warehouseId", "sku", "quantity"],
                properties: {
                  warehouseId: { type: "string", format: "uuid" },
                  sku: { type: "string", pattern: "^[A-Z]{3}-\\d{5}-[A-Z]$" },
                  quantity: { type: "integer", minimum: 1 }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Stock added" },
          "422": { description: "Storage or capacity rule failed" }
        }
      }
    },
    "/inventory/transfer": {
      post: {
        security: [{ bearerAuth: [] }],
        summary: "Atomically transfer stock between warehouses",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fromWarehouseId", "toWarehouseId", "sku", "quantity"],
                properties: {
                  fromWarehouseId: { type: "string", format: "uuid" },
                  toWarehouseId: { type: "string", format: "uuid" },
                  sku: { type: "string", pattern: "^[A-Z]{3}-\\d{5}-[A-Z]$" },
                  quantity: { type: "integer", minimum: 1 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Stock transferred" },
          "422": { description: "Business rule failed" }
        }
      }
    },
    "/inventory/report": {
      get: {
        security: [{ bearerAuth: [] }],
        summary: "Paginated warehouse inventory report",
        parameters: [
          { name: "warehousePage", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "warehousesPerPage", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
          { name: "warehouseItemPage", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "warehouseItemsPerPage", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } }
        ],
        responses: {
          "200": { description: "Inventory report" }
        }
      }
    }
  }
} as const;
