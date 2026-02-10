import { Org, OrgData, Project, ProjectData, Task, TaskData, notNull } from "../types.js";

const ensureString = (value: unknown) => (typeof value === "string" ? value : "");

export const mapOrgRow = (row: Partial<OrgData> & { id?: string; created_at?: string | null; created_by?: string | null }): Org | null => {
  if (!row?.id) return null;
  return {
    id: row.id,
    name: ensureString(row.name),
    cnpj: row.cnpj ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    createdBy: row.created_by ?? row.createdBy ?? null,
  };
};

export const mapProjectRow = (
  row: Partial<ProjectData> & {
    id?: string;
    organization_id?: string;
    hourly_rate?: number | string | null;
    created_at?: string | null;
    created_by?: string | null;
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
    createdBy: row.created_by ?? row.createdBy ?? null,
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
    created_by?: string | null;
  },
): Task | null => {
  if (!row?.id) return null;
  const hours = typeof row.hours === "string" ? parseFloat(row.hours) : row.hours ?? 0;
  const createdAtValue = row.created_at ?? row.createdAt ?? new Date().toISOString();
  const dateValue = row.date ?? createdAtValue;
  const dueDateValue = row.due_date ?? row.dueDate ?? dateValue;
  const statusValue = row.status ?? "pending";
  const parsedDueDate = new Date(dueDateValue);
  const isOverdue =
    statusValue !== "completed" && parsedDueDate.getTime() < Date.now();

  return {
    id: row.id,
    title: ensureString(row.title),
    description: row.description ?? null,
    projectId: row.project_id ?? row.projectId ?? "",
    hours,
    date: dateValue,
    dueDate: dueDateValue,
    status: isOverdue ? "late" : statusValue,
    createdAt: createdAtValue,
    createdBy: row.created_by ?? row.createdBy ?? null,
  };
};

export const safeRows = <T>(rows: (T | null | undefined)[]): T[] => rows.filter((item): item is T => item != null);
