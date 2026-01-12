import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization, Project, Task } from '@/types';

interface AppState {
  organizations: Organization[];
  projects: Project[];
  tasks: Task[];
  
  // Organization actions
  addOrganization: (org: Omit<Organization, 'id' | 'createdAt'>) => void;
  updateOrganization: (id: string, org: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      organizations: [],
      projects: [],
      tasks: [],
      
      addOrganization: (org) =>
        set((state) => ({
          organizations: [
            ...state.organizations,
            { ...org, id: crypto.randomUUID(), createdAt: new Date() },
          ],
        })),
      
      updateOrganization: (id, org) =>
        set((state) => ({
          organizations: state.organizations.map((o) =>
            o.id === id ? { ...o, ...org } : o
          ),
        })),
      
      deleteOrganization: (id) =>
        set((state) => ({
          organizations: state.organizations.filter((o) => o.id !== id),
          projects: state.projects.filter((p) => p.organizationId !== id),
          tasks: state.tasks.filter(
            (t) => !state.projects.find((p) => p.organizationId === id && p.id === t.projectId)
          ),
        })),
      
      addProject: (project) =>
        set((state) => ({
          projects: [
            ...state.projects,
            { ...project, id: crypto.randomUUID(), createdAt: new Date() },
          ],
        })),
      
      updateProject: (id, project) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...project } : p
          ),
        })),
      
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
        })),
      
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, id: crypto.randomUUID(), createdAt: new Date() },
          ],
        })),
      
      updateTask: (id, task) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...task } : t
          ),
        })),
      
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'pj-manager-storage',
    }
  )
);
