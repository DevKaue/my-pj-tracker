import { randomUUID } from "crypto";
import { supabaseRequest } from "../firebase.js";
import { mapOrgRow, mapProjectRow, mapTaskRow, safeRows } from "./helpers.js";
import { Org, OrgData, Project, Task } from "../types.js";

const buildOrganizationParams = (userId: string) => ({
  select: "*",
  order: "created_at.desc",
  created_by: `eq.${userId}`,
});

export async function listOrganizations(userId: string): Promise<Org[]> {
  const rows = await supabaseRequest<Org[]>(`organizations`, {
    params: buildOrganizationParams(userId),
  });
  return safeRows((rows ?? []).map(mapOrgRow));
}

const buildDeleteParams = (userId: string, overrides?: Record<string, string>) => ({
  created_by: `eq.${userId}`,
  ...overrides,
});

export async function createOrganization(data: Omit<OrgData, "createdAt">, userId: string): Promise<Org> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const payload = {
    id,
    name: data.name,
    cnpj: data.cnpj ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    created_at: createdAt,
    created_by: userId,
  };
  const rows = await supabaseRequest<Org[]>(`organizations`, {
    method: "POST",
    body: payload,
    headers: { Prefer: "return=representation" },
  });
  if (!rows || rows.length === 0) throw new Error("Não foi possível criar a organização.");
  return mapOrgRow(rows[0])!;
}

export async function updateOrganization(id: string, data: Partial<OrgData>, userId: string): Promise<Org | null> {
  const payload = {
    ...(data.name ? { name: data.name } : {}),
    ...(data.cnpj !== undefined ? { cnpj: data.cnpj } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
  };
  const rows = await supabaseRequest<Org[]>(`organizations`, {
    method: "PATCH",
    body: payload,
    params: {
      ...buildDeleteParams(userId, { id: `eq.${id}` }),
      select: "*",
    },
    headers: { Prefer: "return=representation" },
  });
  if (!rows || rows.length === 0) return null;
  return mapOrgRow(rows[0]);
}

export async function deleteOrganizationCascade(orgId: string, userId: string): Promise<boolean> {
  const rows = await supabaseRequest<Org[]>(`organizations`, {
    params: buildDeleteParams(userId, { select: "id", id: `eq.${orgId}` }),
  });
  if (!rows || rows.length === 0) return false;

  const projects = await supabaseRequest<Project[]>(`projects`, {
    params: buildDeleteParams(userId, { select: "id", organization_id: `eq.${orgId}` }),
  });
  const projectIds = (projects ?? []).map((row) => row.id).filter(Boolean);

  if (projectIds.length > 0) {
    await supabaseRequest(`tasks`, {
      method: "DELETE",
      params: {
        created_by: `eq.${userId}`,
        "project_id": `in.(${projectIds.join(",")})`,
      },
    });
  }

  await supabaseRequest(`projects`, {
    method: "DELETE",
    params: buildDeleteParams(userId, { organization_id: `eq.${orgId}` }),
  });

  await supabaseRequest(`organizations`, {
    method: "DELETE",
    params: buildDeleteParams(userId, { id: `eq.${orgId}` }),
  });

  return true;
}

export async function getOrganization(id: string, userId: string): Promise<Org | null> {
  const rows = await supabaseRequest<Org[]>(`organizations`, {
    params: buildDeleteParams(userId, { select: "*", id: `eq.${id}` }),
  });
  if (!rows || rows.length === 0) return null;
  return mapOrgRow(rows[0]);
}

export async function listProjectsByOrg(orgId: string, userId: string): Promise<Project[]> {
  const rows = await supabaseRequest<Project[]>(`projects`, {
    params: buildDeleteParams(userId, {
      select: "*",
      organization_id: `eq.${orgId}`,
      order: "created_at.desc",
    }),
  });
  return safeRows((rows ?? []).map(mapProjectRow));
}

export async function listTasksByProjectIds(projectIds: string[], userId: string): Promise<Task[]> {
  if (projectIds.length === 0) return [];
  const rows = await supabaseRequest<Task[]>(`tasks`, {
    params: {
      select: "*",
      "project_id": `in.(${projectIds.join(",")})`,
      order: "date.desc",
      created_by: `eq.${userId}`,
    },
  });
  return safeRows((rows ?? []).map(mapTaskRow));
}
