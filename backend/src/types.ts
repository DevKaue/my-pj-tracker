export type OrgData = {
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  createdBy?: string | null;
};

export type ProjectData = {
  name: string;
  description?: string | null;
  organizationId: string;
  hourlyRate: number;
  status: "active" | "completed" | "paused";
  createdAt: string;
  createdBy?: string | null;
};

export type TaskData = {
  title: string;
  description?: string | null;
  projectId: string;
  hours: number;
  date: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "late";
  createdAt: string;
  createdBy?: string | null;
};

export type Org = OrgData & { id: string };
export type Project = ProjectData & { id: string };
export type Task = TaskData & { id: string };

export const notNull = <T>(value: T | null | undefined): value is T => value != null;
