import { z } from "zod";

export const skuSchema = z.string().regex(/^[A-Z]{3}-\d{5}-[A-Z]$/, {
  message: "SKU must match ABC-12345-X format"
});

export const positiveQuantitySchema = z.number({
  invalid_type_error: "Quantity must be a number"
}).int("Quantity must be a whole number").positive("Quantity must be greater than 0");

export const nonNegativeQuantitySchema = z.number({
  invalid_type_error: "Quantity must be a number"
}).int("Quantity must be a whole number").min(0, "Quantity cannot be negative");

export const addInventorySchema = z.object({
  warehouseId: z.string().uuid(),
  sku: skuSchema,
  quantity: positiveQuantitySchema
});

export const transferInventorySchema = z.object({
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  sku: skuSchema,
  quantity: positiveQuantitySchema
}).refine((value) => value.fromWarehouseId !== value.toWarehouseId, {
  message: "Source and destination warehouses must be different",
  path: ["toWarehouseId"]
});

export const reportQuerySchema = z.object({
  // Report pagination is split by scope so large warehouse lists and large SKU lists stay bounded.
  warehousePage: z.coerce.number().int().positive().default(1),
  warehousesPerPage: z.coerce.number().int().min(1).max(100).default(50),
  warehouseItemPage: z.coerce.number().int().positive().default(1),
  warehouseItemsPerPage: z.coerce.number().int().min(1).max(100).default(50)
});

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(240),
  maxCapacity: z.number().int().positive(),
  type: z.enum(["STANDARD", "COLD"])
});

export const updateWarehouseSchema = createWarehouseSchema;

const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: skuSchema,
  storageRequirement: z.enum(["STANDARD", "COLD"])
});

export const createItemSchema = itemSchema.extend({
  warehouseId: z.string().uuid().optional(),
  quantity: positiveQuantitySchema.default(1)
});

export const updateItemSchema = itemSchema;

export const setInventorySchema = z.object({
  quantity: nonNegativeQuantitySchema
});

export const uuidParamSchema = z.string().uuid();

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});
