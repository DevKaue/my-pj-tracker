import type { Organization, Project, Task } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type OrgInput = {
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
};

export type ProjectInput = {
  name: string;
  description?: string;
  organizationId: string;
  hourlyRate: number;
  status: 'active' | 'completed' | 'paused';
};

export type TaskInput = {
  title: string;
  description?: string;
  projectId: string;
  hours: number;
  date: string | Date;
  dueDate: string | Date;
  status: 'pending' | 'in_progress' | 'completed' | 'late';
};

export type AuthContext = {
  userId: string;
  token: string;
};

export function ensureAuthContext(userId?: string, token?: string): AuthContext {
  if (!userId || !token) {
    throw new Error('Usuário não autenticado');
  }
  return { userId, token };
}

type OrganizationResponse = {
  id: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  created_at?: string;
};

type ProjectResponse = {
  id: string;
  name: string;
  description?: string | null;
  organizationId?: string;
  organization_id?: string;
  hourlyRate?: number | string;
  hourly_rate?: number | string;
  status?: Project['status'];
  createdAt?: string;
  created_at?: string;
};

type TaskResponse = {
  id: string;
  title: string;
  description?: string | null;
  projectId?: string;
  project_id?: string;
  hours?: number | string;
  date?: string;
  dueDate?: string;
  due_date?: string;
  status?: Task['status'];
  createdAt?: string;
  created_at?: string;
};

const parseDate = (value?: string): Date => (value ? new Date(value) : new Date());

const parseNumber = (value: number | string | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

async function request<T>(path: string, auth: AuthContext, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const message = typeof body.message === 'string' ? body.message : res.statusText;
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Helpers para converter datas em objetos Date
const mapOrganization = (org: OrganizationResponse): Organization => ({
  id: org.id,
  name: org.name,
  cnpj: org.cnpj ?? undefined,
  email: org.email ?? undefined,
  phone: org.phone ?? undefined,
  createdAt: parseDate(org.createdAt ?? org.created_at),
});

const mapProject = (project: ProjectResponse): Project => ({
  id: project.id,
  name: project.name,
  description: project.description ?? undefined,
  organizationId: project.organizationId ?? project.organization_id ?? '',
  hourlyRate: parseNumber(project.hourlyRate ?? project.hourly_rate),
  status: project.status ?? 'active',
  createdAt: parseDate(project.createdAt ?? project.created_at),
});

const mapTask = (task: TaskResponse): Task => ({
  id: task.id,
  title: task.title,
  description: task.description ?? undefined,
  projectId: task.projectId ?? task.project_id ?? '',
  hours: parseNumber(task.hours),
  date: parseDate(task.date ?? task.createdAt ?? task.created_at),
  dueDate: parseDate(
    task.dueDate ?? task.due_date ?? task.date ?? task.createdAt ?? task.created_at,
  ),
  status: task.status ?? 'pending',
  createdAt: parseDate(task.createdAt ?? task.created_at),
});

export const api = {
  async getOrganizations(auth: AuthContext) {
    const data = await request<OrganizationResponse[]>('/organizations', auth);
    return data.map(mapOrganization);
  },
  async createOrganization(payload: OrgInput, auth: AuthContext) {
    const data = await request<OrganizationResponse>('/organizations', auth, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapOrganization(data);
  },
  async updateOrganization(id: string, payload: Partial<OrgInput>, auth: AuthContext) {
    const data = await request<OrganizationResponse>(`/organizations/${id}`, auth, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapOrganization(data);
  },
  async deleteOrganization(id: string, auth: AuthContext) {
    await request<void>(`/organizations/${id}`, auth, { method: 'DELETE' });
  },

  async getProjects(auth: AuthContext, organizationId?: string) {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    const data = await request<ProjectResponse[]>(`/projects${query}`, auth);
    return data.map(mapProject);
  },
  async createProject(payload: ProjectInput, auth: AuthContext) {
    const data = await request<ProjectResponse>('/projects', auth, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapProject(data);
  },
  async updateProject(id: string, payload: Partial<ProjectInput>, auth: AuthContext) {
    const data = await request<ProjectResponse>(`/projects/${id}`, auth, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapProject(data);
  },
  async deleteProject(id: string, auth: AuthContext) {
    await request<void>(`/projects/${id}`, auth, { method: 'DELETE' });
  },

  async getTasks(auth: AuthContext, filters?: { projectId?: string; organizationId?: string }) {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.organizationId) params.append('organizationId', filters.organizationId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await request<TaskResponse[]>(`/tasks${query}`, auth);
    return data.map(mapTask);
  },
  async createTask(payload: TaskInput, auth: AuthContext) {
    const { dueDate, ...rest } = payload;
    const data = await request<TaskResponse>('/tasks', auth, {
      method: 'POST',
      body: JSON.stringify({
        ...rest,
        date: new Date(payload.date).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
      }),
    });
    return mapTask(data);
  },
  async updateTask(id: string, payload: Partial<TaskInput>, auth: AuthContext) {
    const { dueDate, ...rest } = payload;
    const data = await request<TaskResponse>(`/tasks/${id}`, auth, {
      method: 'PUT',
      body: JSON.stringify({
        ...rest,
        date: payload.date ? new Date(payload.date).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      }),
    });
    return mapTask(data);
  },
  async deleteTask(id: string, auth: AuthContext) {
    await request<void>(`/tasks/${id}`, auth, { method: 'DELETE' });
  },
};
