import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, OrgInput, ProjectInput, TaskInput } from '@/lib/api';
import { Organization, Project, Task } from '@/types';

export function useOrganizations() {
  const queryClient = useQueryClient();
  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
  });

  const patchOrganizations = (updater: (items: Organization[]) => Organization[]) => {
    queryClient.setQueryData<Organization[]>(['organizations'], (prev) => {
      const current = prev ?? [];
      return updater(current);
    });
  };

  const createOrganization = useMutation({
    mutationFn: (payload: OrgInput) => api.createOrganization(payload),
    onSuccess: (org) => {
      patchOrganizations((items) => [...items, org]);
    },
  });

  const updateOrganization = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<OrgInput> }) =>
      api.updateOrganization(id, payload),
    onSuccess: (org) => {
      patchOrganizations((items) =>
        items.map((item) => (item.id === org.id ? org : item)),
      );
    },
  });

  const deleteOrganization = useMutation({
    mutationFn: (id: string) => api.deleteOrganization(id),
    onSuccess: (_, id) => {
      patchOrganizations((items) => items.filter((org) => org.id !== id));

      const projectsData = queryClient.getQueryData<Project[]>(['projects']);
      if (projectsData) {
        const remainingProjects = projectsData.filter((project) => project.organizationId !== id);
        if (remainingProjects.length !== projectsData.length) {
          queryClient.setQueryData<Project[]>(['projects'], remainingProjects);
        }

        const removedProjectIds = new Set<string>();
        projectsData.forEach((project) => {
          if (project.organizationId === id) {
            removedProjectIds.add(project.id);
          }
        });
        if (removedProjectIds.size > 0) {
          const tasksData = queryClient.getQueryData<Task[]>(['tasks']);
          if (tasksData) {
            queryClient.setQueryData<Task[]>(
              ['tasks'],
              tasksData.filter((task) => !removedProjectIds.has(task.projectId)),
            );
          }
        }
      }
    },
  });

  return { organizationsQuery, createOrganization, updateOrganization, deleteOrganization };
}

export function useProjects() {
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  const patchProjects = (updater: (items: Project[]) => Project[]) => {
    queryClient.setQueryData<Project[]>(['projects'], (prev) => {
      const current = prev ?? [];
      return updater(current);
    });
  };

  const createProject = useMutation({
    mutationFn: (payload: ProjectInput) => api.createProject(payload),
    onSuccess: (project) => {
      patchProjects((items) => [...items, project]);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProjectInput> }) =>
      api.updateProject(id, payload),
    onSuccess: (project) => {
      patchProjects((items) =>
        items.map((item) => (item.id === project.id ? project : item)),
      );
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: (_, id) => {
      patchProjects((items) => items.filter((project) => project.id !== id));

      const tasksData = queryClient.getQueryData<Task[]>(['tasks']);
      if (tasksData) {
        queryClient.setQueryData<Task[]>(['tasks'], tasksData.filter((task) => task.projectId !== id));
      }
    },
  });

  return { projectsQuery, createProject, updateProject, deleteProject };
}

export function useTasks(filters?: { projectId?: string; organizationId?: string }) {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.getTasks(filters),
  });

  const createTask = useMutation({
    mutationFn: (payload: TaskInput) => api.createTask(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaskInput> }) =>
      api.updateTask(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { tasksQuery, createTask, updateTask, deleteTask };
}
