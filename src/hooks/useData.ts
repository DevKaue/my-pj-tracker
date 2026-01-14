import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, OrgInput, ProjectInput, TaskInput } from '@/lib/api';

export function useOrganizations() {
  const queryClient = useQueryClient();
  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.getOrganizations(),
  });

  const createOrganization = useMutation({
    mutationFn: (payload: OrgInput) => api.createOrganization(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });

  const updateOrganization = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<OrgInput> }) =>
      api.updateOrganization(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });

  const deleteOrganization = useMutation({
    mutationFn: (id: string) => api.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

  const createProject = useMutation({
    mutationFn: (payload: ProjectInput) => api.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProjectInput> }) =>
      api.updateProject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
