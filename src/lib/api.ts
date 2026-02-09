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
  status: 'pending' | 'in_progress' | 'completed';
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.message || res.statusText;
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Helpers para converter datas em objetos Date
const mapOrganization = (org: any) => ({ ...org, createdAt: new Date(org.createdAt) });
const mapProject = (project: any) => ({ ...project, createdAt: new Date(project.createdAt) });
  const mapTask = (task: any) => ({
    ...task,
    date: new Date(task.date),
    dueDate: new Date(task.due_date ?? task.dueDate ?? task.date),
    createdAt: new Date(task.createdAt),
  });

export const api = {
  async getOrganizations() {
    const data = await request<any[]>('/organizations');
    return data.map(mapOrganization);
  },
  async createOrganization(payload: OrgInput) {
    const data = await request<any>('/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapOrganization(data);
  },
  async updateOrganization(id: string, payload: Partial<OrgInput>) {
    const data = await request<any>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapOrganization(data);
  },
  async deleteOrganization(id: string) {
    await request<void>(`/organizations/${id}`, { method: 'DELETE' });
  },

  async getProjects(organizationId?: string) {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    const data = await request<any[]>(`/projects${query}`);
    return data.map(mapProject);
  },
  async createProject(payload: ProjectInput) {
    const data = await request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapProject(data);
  },
  async updateProject(id: string, payload: Partial<ProjectInput>) {
    const data = await request<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapProject(data);
  },
  async deleteProject(id: string) {
    await request<void>(`/projects/${id}`, { method: 'DELETE' });
  },

  async getTasks(filters?: { projectId?: string; organizationId?: string }) {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.organizationId) params.append('organizationId', filters.organizationId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await request<any[]>(`/tasks${query}`);
    return data.map(mapTask);
  },
  async createTask(payload: TaskInput) {
    const { dueDate, ...rest } = payload;
    const data = await request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...rest,
        date: new Date(payload.date).toISOString(),
        due_date: new Date(dueDate).toISOString(),
      }),
    });
    return mapTask(data);
  },
  async updateTask(id: string, payload: Partial<TaskInput>) {
    const data = await request<any>(`/tasks/${id}`, {
      method: 'PUT',
    const { dueDate, ...rest } = payload;
    body: JSON.stringify({
      ...rest,
      date: payload.date ? new Date(payload.date).toISOString() : undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
    }),
    });
    return mapTask(data);
  },
  async deleteTask(id: string) {
    await request<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};
