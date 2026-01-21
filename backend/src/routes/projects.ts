import { Router } from "express";
import { projectSchema } from "../schemas.js";
import { createProject, deleteProjectCascade, getProject, listProjects, updateProject } from "../repositories/projects.js";
import { getOrganization } from "../repositories/organizations.js";

export const projectsRouter = Router();

projectsRouter.get("/", async (req, res, next) => {
  try {
    const { organizationId } = req.query;
    const data = await listProjects(organizationId ? String(organizationId) : undefined);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

projectsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = projectSchema.parse(req.body);
    const org = await getOrganization(parsed.organizationId);
    if (!org) return res.status(400).json({ message: "Organizacao inexistente / Unknown organization" });
    const project = await createProject(parsed);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

projectsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const parsed = projectSchema.partial().parse(req.body);
    if (parsed.organizationId) {
      const org = await getOrganization(parsed.organizationId);
      if (!org) return res.status(400).json({ message: "Organizacao inexistente / Unknown organization" });
    }
    const updated = await updateProject(id, parsed);
    if (!updated) return res.status(404).json({ message: "Projeto nao encontrado / Not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

projectsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleted = await deleteProjectCascade(id);
    if (!deleted) return res.status(404).json({ message: "Projeto nao encontrado / Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
