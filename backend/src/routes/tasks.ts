import { Router } from "express";
import { taskSchema } from "../schemas.js";
import { createTask, deleteTask, listTasks, updateTask } from "../repositories/tasks.js";
import { getProject } from "../repositories/projects.js";

export const tasksRouter = Router();

tasksRouter.get("/", async (req, res, next) => {
  try {
    const { projectId, organizationId } = req.query;
    const data = await listTasks({
      projectId: projectId ? String(projectId) : undefined,
      organizationId: organizationId ? String(organizationId) : undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const project = await getProject(parsed.projectId);
    if (!project) return res.status(400).json({ message: "Projeto inexistente / Unknown project" });
    const task = await createTask(parsed);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

tasksRouter.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const parsed = taskSchema.partial().parse(req.body);
    if (parsed.projectId) {
      const project = await getProject(parsed.projectId);
      if (!project) return res.status(400).json({ message: "Projeto inexistente / Unknown project" });
    }
    const updated = await updateTask(id, parsed);
    if (!updated) return res.status(404).json({ message: "Tarefa nao encontrada / Not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleted = await deleteTask(id);
    if (!deleted) return res.status(404).json({ message: "Tarefa nao encontrada / Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
