import { randomUUID } from "crypto";
import { supabaseRequest } from "../firebase.js";
import { mapTaskRow, safeRows } from "./helpers.js";
import { Project, Task, TaskData } from "../types.js";

const buildTaskParams = (userId: string, overrides?: Record<string, string>) => ({
  select: "*",
  order: "date.desc",
  created_by: `eq.${userId}`,
  ...overrides,
});

type TaskFilters = { projectId?: string; organizationId?: string };

export async function listTasks(filters: TaskFilters | undefined, userId: string): Promise<Task[]> {
  const { projectId, organizationId } = filters || {};

  if (projectId) {
    const rows = await supabaseRequest<Task[]>(`tasks`, {
      params: buildTaskParams(userId, { project_id: `eq.${projectId}` }),
    });
    return safeRows((rows ?? []).map(mapTaskRow));
  }

  if (organizationId) {
    const projects = await supabaseRequest<Project[]>(`projects`, {
      params: {
        select: "id",
        organization_id: `eq.${organizationId}`,
        created_by: `eq.${userId}`,
      },
    });
    const projectIds = (projects ?? []).map((row) => row.id).filter(Boolean);
    if (projectIds.length === 0) return [];

    const rows = await supabaseRequest<Task[]>(`tasks`, {
      params: {
        ...buildTaskParams(userId),
        project_id: `in.(${projectIds.join(",")})`,
      },
    });
    return safeRows((rows ?? []).map(mapTaskRow));
  }

  const rows = await supabaseRequest<Task[]>(`tasks`, {
    params: buildTaskParams(userId),
  });
  return safeRows((rows ?? []).map(mapTaskRow));
}

export async function createTask(data: Omit<TaskData, "createdAt">, userId: string): Promise<Task> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const payload = {
    id,
    title: data.title,
    description: data.description ?? null,
    project_id: data.projectId,
    hours: data.hours,
    date: data.date,
    due_date: data.dueDate,
    status: data.status === "late" ? "pending" : data.status,
    created_by: userId,
    created_at: createdAt,
  };
  const rows = await supabaseRequest<Task[]>(`tasks`, {
    method: "POST",
    body: payload,
    headers: { Prefer: "return=representation" },
  });
  if (!rows || rows.length === 0) throw new Error("Não foi possível criar a tarefa.");
  return mapTaskRow(rows[0])!;
}

export async function updateTask(id: string, data: Partial<TaskData>, userId: string): Promise<Task | null> {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.projectId !== undefined) payload.project_id = data.projectId;
  if (data.hours !== undefined) payload.hours = data.hours;
  if (data.date !== undefined) payload.date = data.date;
  // "late" is computed on read (mapTaskRow), never stored. Normalize to "pending".
  if (data.status !== undefined) payload.status = data.status === "late" ? "pending" : data.status;
  if (data.dueDate !== undefined) payload.due_date = data.dueDate;
  const rows = await supabaseRequest<Task[]>(`tasks`, {
    method: "PATCH",
    body: payload,
    params: {
      ...buildTaskParams(userId, { id: `eq.${id}` }),
      select: "*",
    },
    headers: { Prefer: "return=representation" },
  });
  if (!rows || rows.length === 0) return null;
  return mapTaskRow(rows[0]);
}

export async function deleteTask(id: string, userId: string): Promise<boolean> {
  const rows = await supabaseRequest<Task[]>(`tasks`, {
    params: buildTaskParams(userId, { select: "id", id: `eq.${id}` }),
  });
  if (!rows || rows.length === 0) return false;
  await supabaseRequest(`tasks`, {
    method: "DELETE",
    params: buildTaskParams(userId, { id: `eq.${id}` }),
  });
  return true;
}
