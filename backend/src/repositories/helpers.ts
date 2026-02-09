import { Org, OrgData, Project, ProjectData, Task, TaskData, notNull } from "../types.js";

const ensureString = (value: unknown) => (typeof value === "string" ? value : "");

export const mapOrgRow = (row: Partial<OrgData> & { id?: string; created_at?: string | null }): Org | null => {
  if (!row?.id) return null;
  return {
    id: row.id,
    name: ensureString(row.name),
    cnpj: row.cnpj ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
};

export const mapProjectRow = (
  row: Partial<ProjectData> & {
    id?: string;
    organization_id?: string;
    hourly_rate?: number | string | null;
    created_at?: string | null;
  },
): Project | null => {
  if (!row?.id) return null;
  const hourlyRate = typeof row.hourly_rate === "string" ? parseFloat(row.hourly_rate) : row.hourly_rate ?? 0;
  return {
    id: row.id,
    name: ensureString(row.name),
    description: row.description ?? null,
    organizationId: row.organization_id ?? row.organizationId ?? "",
    hourlyRate,
    status: row.status ?? "active",
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
};

export const mapTaskRow = (
  row: Partial<TaskData> & {
    id?: string;
    project_id?: string;
    hours?: number | string | null;
    date?: string | null;
    due_date?: string | null;
    created_at?: string | null;
  },
): Task | null => {
  if (!row?.id) return null;
  const hours = typeof row.hours === "string" ? parseFloat(row.hours) : row.hours ?? 0;
  return {
    id: row.id,
    title: ensureString(row.title),
    description: row.description ?? null,
    projectId: row.project_id ?? row.projectId ?? "",
    hours,
    date: row.date ?? row.createdAt ?? new Date().toISOString(),
    dueDate: row.due_date ?? row.dueDate ?? row.date ?? row.createdAt ?? new Date().toISOString(),
    status: row.status ?? "pending",
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
};

export const safeRows = <T>(rows: (T | null | undefined)[]): T[] => rows.filter((item): item is T => item != null);
