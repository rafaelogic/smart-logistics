import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "../docs/openapi.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authRouter } from "./authRoutes.js";
import { inventoryRouter } from "./inventoryRoutes.js";
import { itemRouter } from "./itemRoutes.js";
import { warehouseRouter } from "./warehouseRoutes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

apiRouter.get("/openapi.json", (_request, response) => {
  response.json(openApiDocument);
});

apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
apiRouter.use("/auth", authRouter);
apiRouter.use("/warehouses", authMiddleware, warehouseRouter);
apiRouter.use("/items", authMiddleware, itemRouter);
apiRouter.use("/inventory", authMiddleware, inventoryRouter);
