import { Router } from "express";
import { createItem, listItems } from "../services/itemService.js";
import { createItemSchema } from "../validations/schemas.js";

export const itemRouter = Router();

itemRouter.post("/", async (request, response, next) => {
  try {
    const input = createItemSchema.parse(request.body);
    const item = await createItem(input);
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
