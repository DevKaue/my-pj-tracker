import { Router } from "express";
import { taskSchema } from "../schemas.js";
import { requireUserId, getUserId } from "../middleware/user.js";
import { createTask, deleteTask, listTasks, updateTask } from "../repositories/tasks.js";
import { getProject } from "../repositories/projects.js";

export const tasksRouter = Router();

tasksRouter.use(requireUserId);

tasksRouter.get("/", async (req, res, next) => {
  try {
    const { projectId, organizationId } = req.query;
    const userId = getUserId(res);
    const data = await listTasks(
      {
        projectId: projectId ? String(projectId) : undefined,
        organizationId: organizationId ? String(organizationId) : undefined,
      },
      userId,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const userId = getUserId(res);
    const project = await getProject(parsed.projectId, userId);
    if (!project) return res.status(400).json({ message: "Projeto inexistente / Unknown project" });
    const task = await createTask(parsed, userId);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

tasksRouter.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const parsed = taskSchema.partial().parse(req.body);
    const userId = getUserId(res);
    if (parsed.projectId) {
      const project = await getProject(parsed.projectId, userId);
      if (!project) return res.status(400).json({ message: "Projeto inexistente / Unknown project" });
    }
    const updated = await updateTask(id, parsed, userId);
    if (!updated) return res.status(404).json({ message: "Tarefa nao encontrada / Not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = getUserId(res);
    const deleted = await deleteTask(id, userId);
    if (!deleted) return res.status(404).json({ message: "Tarefa nao encontrada / Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
