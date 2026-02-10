import { randomUUID } from "crypto";
import { supabaseRequest } from "../firebase.js";
import { mapProjectRow, safeRows } from "./helpers.js";
import { Project, ProjectData } from "../types.js";

const buildProjectParams = (userId: string, overrides?: Record<string, string>) => ({
  select: "*",
  order: "created_at.desc",
  created_by: `eq.${userId}`,
  ...overrides,
});

export async function listProjects(userId: string, organizationId?: string): Promise<Project[]> {
  const params = buildProjectParams(userId, organizationId ? { organization_id: `eq.${organizationId}` } : undefined);
  const rows = await supabaseRequest<Project[]>(`projects`, { params });
  return safeRows((rows ?? []).map(mapProjectRow));
}

export async function createProject(data: Omit<ProjectData, "createdAt">, userId: string): Promise<Project> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const payload = {
    id,
    name: data.name,
    description: data.description ?? null,
    organization_id: data.organizationId,
    hourly_rate: data.hourlyRate,
    status: data.status,
    created_by: userId,
    created_at: createdAt,
  };
  const rows = await supabaseRequest<Project[]>(`projects`, {
    method: "POST",
    body: payload,
    headers: { Prefer: "return=representation" },
  });
  if (!rows || rows.length === 0) throw new Error("Não foi possível criar o projeto.");
  return mapProjectRow(rows[0])!;
}

export async function updateProject(id: string, data: Partial<ProjectData>, userId: string): Promise<Project | null> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.organizationId !== undefined) payload.organization_id = data.organizationId;
  if (data.hourlyRate !== undefined) payload.hourly_rate = data.hourlyRate;
  if (data.status !== undefined) payload.status = data.status;
  const rows = await supabaseRequest<Project[]>(`projects`, {
    method: "PATCH",
    body: payload,
    params: {
      ...buildProjectParams(userId, { id: `eq.${id}` }),
      select: "*",
    },
    headers: { Prefer: "return=representation" },
  });
  if (!rows || rows.length === 0) return null;
  return mapProjectRow(rows[0]);
}

export async function deleteProjectCascade(projectId: string, userId: string): Promise<boolean> {
  const rows = await supabaseRequest<Project[]>(`projects`, {
    params: buildProjectParams(userId, { select: "id", id: `eq.${projectId}` }),
  });
  if (!rows || rows.length === 0) return false;

  await supabaseRequest(`tasks`, {
    method: "DELETE",
    params: { created_by: `eq.${userId}`, project_id: `eq.${projectId}` },
  });

  await supabaseRequest(`projects`, {
    method: "DELETE",
    params: buildProjectParams(userId, { id: `eq.${projectId}` }),
  });

  return true;
}

export async function getProject(id: string, userId: string): Promise<Project | null> {
  const rows = await supabaseRequest<Project[]>(`projects`, {
    params: buildProjectParams(userId, { select: "*", id: `eq.${id}` }),
  });
  if (!rows || rows.length === 0) return null;
  return mapProjectRow(rows[0]);
}
