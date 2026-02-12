export interface Organization {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  hourlyRate: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  hours: number;
  date: Date;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'late';
  createdAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  email: string;
  document: string;
  companyName?: string | null;
  companyCnpj?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
}

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  organizationId?: string;
  projectId?: string;
}

export interface ReportData {
  totalHours: number;
  totalValue: number;
  tasksByProject: {
    projectId: string;
    projectName: string;
    organizationName: string;
    hours: number;
    value: number;
    tasks: Task[];
  }[];
}
