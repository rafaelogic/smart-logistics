import { Router } from "express";
import { withTransaction } from "../database/db.js";
import { addInventory, getInventoryReport, transferInventory } from "../services/inventoryService.js";
import {
  addInventorySchema,
  reportQuerySchema,
  transferInventorySchema
} from "../validations/schemas.js";

export const inventoryRouter = Router();

inventoryRouter.post("/add", async (request, response, next) => {
  try {
    const input = addInventorySchema.parse(request.body);
    const result = await withTransaction((client) => addInventory(client, input));
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.post("/transfer", async (request, response, next) => {
  try {
    const input = transferInventorySchema.parse(request.body);
    const result = await withTransaction((client) => transferInventory(client, input));
    response.json(result);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.get("/report", async (request, response, next) => {
  try {
    const query = reportQuerySchema.parse(request.query);
    const result = await getInventoryReport(
      query.warehousePage,
      query.warehousesPerPage,
      query.warehouseItemPage,
      query.warehouseItemsPerPage
    );
    response.json(result);
  } catch (error) {
    next(error);
  }
});
