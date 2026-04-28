import { Router } from "express";
import { withTransaction } from "../database/db.js";
import { createItem, listItems, softDeleteItem, updateItem } from "../services/itemService.js";
import { createItemSchema, updateItemSchema, uuidParamSchema } from "../validations/schemas.js";

export const itemRouter = Router();

itemRouter.post("/", async (request, response, next) => {
  try {
    const input = createItemSchema.parse(request.body);
    const item = await withTransaction((client) => createItem(client, input));
    response.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

itemRouter.get("/", async (_request, response, next) => {
  try {
    const items = await listItems();
    response.json({ items });
  } catch (error) {
    next(error);
  }
});

itemRouter.put("/:itemId", async (request, response, next) => {
  try {
    const itemId = uuidParamSchema.parse(request.params.itemId);
    const input = updateItemSchema.parse(request.body);
    const item = await withTransaction((client) => updateItem(client, itemId, input));
    response.json(item);
  } catch (error) {
    next(error);
  }
});

itemRouter.delete("/:itemId", async (request, response, next) => {
  try {
    const itemId = uuidParamSchema.parse(request.params.itemId);
    await withTransaction((client) => softDeleteItem(client, itemId));
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
