import { useState, useMemo } from 'react';
import { useOrganizations, useProjects, useTasks } from '@/hooks/useData';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckSquare, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { Task } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TasksPage() {
  const { organizationsQuery } = useOrganizations();
  const { projectsQuery } = useProjects();
  const { tasksQuery, createTask, updateTask, deleteTask } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    hours: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'pending' as Task['status'],
  });

  const organizations = organizationsQuery.data || [];
  const projects = projectsQuery.data || [];
  const tasks = tasksQuery.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) {
      toast.error('Título e projeto são obrigatórios / Title and project are required');
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      projectId: formData.projectId,
      hours: parseFloat(formData.hours) || 0,
      date: new Date(formData.date),
      dueDate: new Date(formData.dueDate),
      status: formData.status,
    };

    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, payload: taskData });
        toast.success('Tarefa atualizada!');
      } else {
        await createTask.mutateAsync(taskData);
        toast.success('Tarefa criada!');
      }

      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar tarefa / Error saving task');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId,
      hours: task.hours.toString(),
      date: format(new Date(task.date), 'yyyy-MM-dd'),
      dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
      status: task.status,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteTask.mutateAsync(id);
        toast.success('Tarefa excluída!');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao excluir tarefa / Error deleting task');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      projectId: '',
      hours: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
    });
    setEditingTask(null);
    setIsOpen(false);
  };

  const getProjectName = (id: string) => {
    return projects.find((p) => p.id === id)?.name || 'Desconhecido';
  };

  const getOrganizationForProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return 'Desconhecido';
    return organizations.find((org) => org.id === project.organizationId)?.name || 'Desconhecido';
  };

  const statusLabels = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
  };

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [tasks]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tarefas"
        description="Registre suas horas trabalhadas"
        action={
          <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : resetForm())}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={projects.length === 0}>
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTask
                      ? 'Atualize os dados da tarefa.'
                      : 'Registre uma nova tarefa com as horas trabalhadas.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="O que você fez?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project">Projeto *</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Horas</Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0"
                        step="0.25"
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Data de entrega</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      A tarefa será marcada como atrasada se não estiver concluída após esta data.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Task['status']) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detalhes adicionais"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTask ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="Crie um projeto primeiro"
          description="Você precisa ter pelo menos um projeto para registrar tarefas."
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="Nenhuma tarefa"
          description="Comece registrando sua primeira tarefa e as horas trabalhadas."
          action={
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Tarefa
            </Button>
          }
        />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="table-header">Data</TableHead>
                <TableHead className="table-header">Tarefa</TableHead>
                <TableHead className="table-header">Projeto</TableHead>
                <TableHead className="table-header">Organização</TableHead>
                <TableHead className="table-header">Horas</TableHead>
                <TableHead className="table-header">Status</TableHead>
                <TableHead className="table-header w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(task.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getProjectName(task.projectId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getOrganizationForProject(task.projectId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Clock className="h-4 w-4" />
                      {task.hours}h
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'badge-status',
                        task.status === 'pending' && 'badge-pending',
                        task.status === 'in_progress' && 'bg-info/10 text-info',
                        task.status === 'completed' && 'badge-active'
                      )}
                    >
                      {statusLabels[task.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
