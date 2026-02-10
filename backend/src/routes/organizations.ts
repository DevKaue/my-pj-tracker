import { Router } from "express";
import { orgSchema } from "../schemas.js";
import { requireUserId, getUserId } from "../middleware/user.js";
import { createOrganization, deleteOrganizationCascade, listOrganizations, updateOrganization } from "../repositories/organizations.js";

export const organizationsRouter = Router();

organizationsRouter.use(requireUserId);

organizationsRouter.get("/", async (_req, res, next) => {
  try {
    const userId = getUserId(res);
    const data = await listOrganizations(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

organizationsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = orgSchema.parse(req.body);
    const userId = getUserId(res);
    const org = await createOrganization(parsed, userId);
    res.status(201).json(org);
  } catch (err) {
    next(err);
  }
});

organizationsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const parsed = orgSchema.partial().parse(req.body);
    const userId = getUserId(res);
    const updated = await updateOrganization(id, parsed, userId);
    if (!updated) return res.status(404).json({ message: "Organizacao nao encontrada / Not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

organizationsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = getUserId(res);
    const deleted = await deleteOrganizationCascade(id, userId);
    if (!deleted) return res.status(404).json({ message: "Organizacao nao encontrada / Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
