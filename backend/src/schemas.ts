import { z } from "zod";

export const orgSchema = z.object({
  name: z.string().min(1, "Nome eh obrigatorio / Name is required"),
  cnpj: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string().min(1),
  hourlyRate: z.number().nonnegative(),
  status: z.enum(["active", "completed", "paused"]),
});

export const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().min(1),
  hours: z.number().nonnegative(),
  date: z.string().transform((val) => new Date(val).toISOString()),
  dueDate: z.string().transform((val) => new Date(val).toISOString()),
  status: z.enum(["pending", "in_progress", "completed", "late"]),
});
