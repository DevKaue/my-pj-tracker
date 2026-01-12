import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderKanban, Plus, Pencil, Trash2 } from 'lucide-react';
import { Project } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const { organizations, projects, addProject, updateProject, deleteProject } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organizationId: '',
    hourlyRate: '',
    status: 'active' as Project['status'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.organizationId) {
      toast.error('Nome e organização são obrigatórios');
      return;
    }

    const projectData = {
      name: formData.name,
      description: formData.description,
      organizationId: formData.organizationId,
      hourlyRate: parseFloat(formData.hourlyRate) || 0,
      status: formData.status,
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
      toast.success('Projeto atualizado!');
    } else {
      addProject(projectData);
      toast.success('Projeto criado!');
    }

    resetForm();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      organizationId: project.organizationId,
      hourlyRate: project.hourlyRate.toString(),
      status: project.status,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas relacionadas serão excluídas.')) {
      deleteProject(id);
      toast.success('Projeto excluído!');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      organizationId: '',
      hourlyRate: '',
      status: 'active',
    });
    setEditingProject(null);
    setIsOpen(false);
  };

  const getOrganizationName = (id: string) => {
    return organizations.find((org) => org.id === id)?.name || 'Desconhecido';
  };

  const statusLabels = {
    active: 'Ativo',
    completed: 'Concluído',
    paused: 'Pausado',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projetos"
        description="Gerencie seus projetos e valores por hora"
        action={
          <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : resetForm())}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={organizations.length === 0}>
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProject
                      ? 'Atualize os dados do projeto.'
                      : 'Adicione um novo projeto para uma organização.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do projeto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organização *</Label>
                    <Select
                      value={formData.organizationId}
                      onValueChange={(value) => setFormData({ ...formData, organizationId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma organização" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Project['status']) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do projeto"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProject ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {organizations.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="Crie uma organização primeiro"
          description="Você precisa ter pelo menos uma organização para criar projetos."
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="Nenhum projeto"
          description="Comece adicionando seu primeiro projeto para gerenciar suas tarefas."
          action={
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Projeto
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <span
                      className={cn(
                        'badge-status',
                        project.status === 'active' && 'badge-active',
                        project.status === 'paused' && 'badge-pending',
                        project.status === 'completed' && 'badge-completed'
                      )}
                    >
                      {statusLabels[project.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getOrganizationName(project.organizationId)}
                  </p>
                  {project.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="mt-3 text-lg font-bold text-primary">
                    R$ {project.hourlyRate.toFixed(2)}/h
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
