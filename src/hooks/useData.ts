import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ensureAuthContext, OrgInput, ProjectInput, TaskInput, ProfileInput } from '@/lib/api';
import { Organization, Project, Task } from '@/types';
import { useAuth } from '@/hooks/useAuth';

function useAuthContext() {
  const { session, user } = useAuth();
  const userId = user?.id;
  const auth = useMemo(() => {
    if (!userId || !session?.access_token) return undefined;
    return ensureAuthContext(userId, session.access_token);
  }, [userId, session?.access_token]);
  return { auth, userId };
}

const buildFiltersSignature = (filters?: { projectId?: string; organizationId?: string }) =>
  `${filters?.projectId ?? ''}|${filters?.organizationId ?? ''}`;

export function useOrganizations() {
  const queryClient = useQueryClient();
  const { auth, userId } = useAuthContext();
  const organizationKey = useMemo(() => ['organizations', userId], [userId]);
  const getAuth = () => {
    if (!auth) {
      throw new Error('Usuário não autenticado');
    }
    return auth;
  };

  const organizationsQuery = useQuery({
    queryKey: organizationKey,
    queryFn: () => api.getOrganizations(getAuth()),
    enabled: Boolean(auth),
  });

  const patchOrganizations = (updater: (items: Organization[]) => Organization[]) => {
    queryClient.setQueryData<Organization[]>(organizationKey, (prev) => {
      const current = prev ?? [];
      return updater(current);
    });
  };

  const createOrganization = useMutation({
    mutationFn: (payload: OrgInput) => api.createOrganization(payload, getAuth()),
    onSuccess: (org) => {
      patchOrganizations((items) => [...items, org]);
    },
  });

  const updateOrganization = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<OrgInput> }) =>
      api.updateOrganization(id, payload, getAuth()),
    onSuccess: (org) => {
      patchOrganizations((items) => items.map((item) => (item.id === org.id ? org : item)));
    },
  });

  const deleteOrganization = useMutation({
    mutationFn: (id: string) => api.deleteOrganization(id, getAuth()),
    onSuccess: (_, id) => {
      patchOrganizations((items) => items.filter((org) => org.id !== id));
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['projects', userId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      }
    },
  });

  return { organizationsQuery, createOrganization, updateOrganization, deleteOrganization };
}

export function useProjects() {
  const queryClient = useQueryClient();
  const { auth, userId } = useAuthContext();
  const projectKey = useMemo(() => ['projects', userId], [userId]);
  const getAuth = () => {
    if (!auth) {
      throw new Error('Usuário não autenticado');
    }
    return auth;
  };

  const projectsQuery = useQuery({
    queryKey: projectKey,
    queryFn: () => api.getProjects(getAuth()),
    enabled: Boolean(auth),
  });

  const patchProjects = (updater: (items: Project[]) => Project[]) => {
    queryClient.setQueryData<Project[]>(projectKey, (prev) => {
      const current = prev ?? [];
      return updater(current);
    });
  };

  const createProject = useMutation({
    mutationFn: (payload: ProjectInput) => api.createProject(payload, getAuth()),
    onSuccess: (project) => {
      patchProjects((items) => [...items, project]);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProjectInput> }) =>
      api.updateProject(id, payload, getAuth()),
    onSuccess: (project) => {
      patchProjects((items) => items.map((item) => (item.id === project.id ? project : item)));
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.deleteProject(id, getAuth()),
    onSuccess: (_, id) => {
      patchProjects((items) => items.filter((project) => project.id !== id));
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      }
    },
  });

  return { projectsQuery, createProject, updateProject, deleteProject };
}

export function useTasks(filters?: { projectId?: string; organizationId?: string }) {
  const queryClient = useQueryClient();
  const { auth, userId } = useAuthContext();
  const filtersSignature = useMemo(() => buildFiltersSignature(filters), [filters]);
  const tasksKey = useMemo(() => ['tasks', userId, filtersSignature], [userId, filtersSignature]);
  const getAuth = () => {
    if (!auth) {
      throw new Error('Usuário não autenticado');
    }
    return auth;
  };

  const tasksQuery = useQuery({
    queryKey: tasksKey,
    queryFn: () => api.getTasks(getAuth(), filters),
    enabled: Boolean(auth),
  });

  const invalidateTasks = () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    }
  };

  const createTask = useMutation({
    mutationFn: (payload: TaskInput) => api.createTask(payload, getAuth()),
    onSuccess: () => {
      invalidateTasks();
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TaskInput> }) =>
      api.updateTask(id, payload, getAuth()),
    onSuccess: () => {
      invalidateTasks();
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.deleteTask(id, getAuth()),
    onSuccess: () => {
      invalidateTasks();
    },
  });

  return { tasksQuery, createTask, updateTask, deleteTask };
}

export function useProfile() {
  const queryClient = useQueryClient();
  const { auth, userId } = useAuthContext();
  const profileKey = useMemo(() => ['profile', userId], [userId]);
  const getAuth = () => {
    if (!auth) {
      throw new Error('Usuário não autenticado');
    }
    return auth;
  };

  const profileQuery = useQuery({
    queryKey: profileKey,
    queryFn: () => api.getProfile(getAuth()),
    enabled: Boolean(auth),
  });

  const updateProfile = useMutation({
    mutationFn: (payload: ProfileInput) => api.updateProfile(payload, getAuth()),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKey, profile);
    },
  });

  return { profileQuery, updateProfile };
}

