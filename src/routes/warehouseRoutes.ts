import { Router } from "express";
import { withTransaction } from "../database/db.js";
import {
  createWarehouse,
  listWarehouses,
  softDeleteWarehouse
} from "../services/warehouseService.js";
import { createWarehouseSchema, uuidParamSchema } from "../validations/schemas.js";

export const warehouseRouter = Router();

warehouseRouter.post("/", async (request, response, next) => {
  try {
    const input = createWarehouseSchema.parse(request.body);
    const warehouse = await createWarehouse(input);
    response.status(201).json(warehouse);
  } catch (error) {
    next(error);
  }
});

warehouseRouter.get("/", async (_request, response, next) => {
  try {
    const warehouses = await listWarehouses();
    response.json({ warehouses });
  } catch (error) {
    next(error);
  }
});

warehouseRouter.delete("/:warehouseId", async (request, response, next) => {
  try {
    const warehouseId = uuidParamSchema.parse(request.params.warehouseId);
    await withTransaction((client) => softDeleteWarehouse(client, warehouseId));
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
