import "./config/loadEnv.js";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDoc } from "./config/openapi.js";
import { organizationsRouter } from "./routes/organizations.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { z } from "zod";

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", now: new Date().toISOString() });
});

app.use("/organizations", organizationsRouter);
app.use("/projects", projectsRouter);
app.use("/tasks", tasksRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error", err);
  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: "Dados invalidos / Invalid data", issues: err.issues });
  }
  res.status(500).json({ message: "Erro interno / Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
