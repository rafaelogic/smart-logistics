import { Router } from "express";
import { withLockedCapacityTransaction } from "../database/db.js";
import { addInventory, deleteInventory, getInventoryReport, setInventory, transferInventory } from "../services/inventoryService.js";
import {
  addInventorySchema,
  reportQuerySchema,
  setInventorySchema,
  transferInventorySchema
} from "../validations/schemas.js";

export const inventoryRouter = Router();

const setInventoryParamsSchema = addInventorySchema.omit({ quantity: true });

inventoryRouter.post("/add", async (request, response, next) => {
  try {
    const input = addInventorySchema.parse(request.body);
    const result = await withLockedCapacityTransaction((client) => addInventory(client, input));
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.post("/transfer", async (request, response, next) => {
  try {
    const input = transferInventorySchema.parse(request.body);
    const result = await withLockedCapacityTransaction((client) => transferInventory(client, input));
    response.json(result);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.put("/:warehouseId/:sku", async (request, response, next) => {
  try {
    const params = setInventoryParamsSchema.parse(request.params);
    const body = setInventorySchema.parse(request.body);
    const input = { ...params, ...body };
    const result = await withLockedCapacityTransaction((client) => setInventory(client, input));
    response.json(result);
  } catch (error) {
    next(error);
  }
});

inventoryRouter.delete("/:warehouseId/:sku", async (request, response, next) => {
  try {
    const input = setInventoryParamsSchema.parse(request.params);
    await withLockedCapacityTransaction((client) => deleteInventory(client, input));
    response.status(204).send();
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
