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
    "/auth/me": {
      get: {
        security: [{ bearerAuth: [] }],
        summary: "Return the current authenticated user",
        responses: {
          "200": { description: "Authenticated user" },
          "401": { description: "Invalid or missing token" }
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
    "/warehouses/{warehouseId}": {
      put: {
        security: [{ bearerAuth: [] }],
        summary: "Update a warehouse",
        parameters: [{ name: "warehouseId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
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
          "200": { description: "Warehouse updated" },
          "422": { description: "Validation or capacity error" }
        }
      },
      delete: {
        security: [{ bearerAuth: [] }],
        summary: "Soft delete an empty warehouse",
        parameters: [{ name: "warehouseId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Warehouse deleted" },
          "409": { description: "Warehouse is not empty" }
        }
      }
    },
    "/items/{itemId}": {
      put: {
        security: [{ bearerAuth: [] }],
        summary: "Update an item",
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
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
          "200": { description: "Item updated" },
          "422": { description: "Validation error" }
        }
      },
      delete: {
        security: [{ bearerAuth: [] }],
        summary: "Soft delete an item without inventory rows",
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "204": { description: "Item deleted" },
          "409": { description: "Item still has inventory" }
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
    "/inventory/{warehouseId}/{sku}": {
      put: {
        security: [{ bearerAuth: [] }],
        summary: "Set stock quantity for a warehouse SKU",
        parameters: [
          { name: "warehouseId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "sku", in: "path", required: true, schema: { type: "string", pattern: "^[A-Z]{3}-\\d{5}-[A-Z]$" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity"],
                properties: {
                  quantity: { type: "integer", minimum: 0 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Stock quantity updated" },
          "422": { description: "Storage or capacity rule failed" }
        }
      },
      delete: {
        security: [{ bearerAuth: [] }],
        summary: "Delete a warehouse SKU inventory row",
        parameters: [
          { name: "warehouseId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "sku", in: "path", required: true, schema: { type: "string", pattern: "^[A-Z]{3}-\\d{5}-[A-Z]$" } }
        ],
        responses: {
          "204": { description: "Inventory row deleted" },
          "404": { description: "Inventory row not found" }
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
