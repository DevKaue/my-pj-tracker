import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { FileText, Download, Clock, DollarSign, Building2, FolderKanban } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportsPage() {
  const { organizations, projects, tasks } = useStore();
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    organizationId: '',
    projectId: '',
  });

  const filteredData = useMemo(() => {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    let filteredTasks = tasks.filter((task) => {
      const taskDate = new Date(task.date);
      return isWithinInterval(taskDate, { start: startDate, end: endDate });
    });

    if (filters.projectId) {
      filteredTasks = filteredTasks.filter((task) => task.projectId === filters.projectId);
    }

    if (filters.organizationId) {
      const orgProjects = projects.filter((p) => p.organizationId === filters.organizationId);
      filteredTasks = filteredTasks.filter((task) =>
        orgProjects.some((p) => p.id === task.projectId)
      );
    }

    // Group by project
    const byProject = filteredTasks.reduce((acc, task) => {
      const project = projects.find((p) => p.id === task.projectId);
      if (!project) return acc;

      if (!acc[project.id]) {
        const org = organizations.find((o) => o.id === project.organizationId);
        acc[project.id] = {
          projectId: project.id,
          projectName: project.name,
          organizationName: org?.name || 'Desconhecido',
          hourlyRate: project.hourlyRate,
          hours: 0,
          value: 0,
          tasks: [],
        };
      }

      acc[project.id].hours += task.hours;
      acc[project.id].value += task.hours * project.hourlyRate;
      acc[project.id].tasks.push(task);

      return acc;
    }, {} as Record<string, { projectId: string; projectName: string; organizationName: string; hourlyRate: number; hours: number; value: number; tasks: typeof tasks }>);

    const projectData = Object.values(byProject);
    const totalHours = projectData.reduce((sum, p) => sum + p.hours, 0);
    const totalValue = projectData.reduce((sum, p) => sum + p.value, 0);

    return { projectData, totalHours, totalValue };
  }, [tasks, projects, organizations, filters]);

  const exportToCSV = () => {
    const headers = ['Projeto', 'Organização', 'Valor/Hora', 'Horas', 'Valor Total'];
    const rows = filteredData.projectData.map((p) => [
      p.projectName,
      p.organizationName,
      `R$ ${p.hourlyRate.toFixed(2)}`,
      p.hours.toFixed(2),
      `R$ ${p.value.toFixed(2)}`,
    ]);

    rows.push(['', '', '', '', '']);
    rows.push(['TOTAL', '', '', filteredData.totalHours.toFixed(2), `R$ ${filteredData.totalValue.toFixed(2)}`]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${filters.startDate}-${filters.endDate}.csv`;
    link.click();
  };

  const filteredProjects = filters.organizationId
    ? projects.filter((p) => p.organizationId === filters.organizationId)
    : projects;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Relatórios"
        description="Visualize e exporte dados para sua nota fiscal"
        action={
          filteredData.projectData.length > 0 && (
            <Button onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="card-elevated p-6 mb-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Final</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Organização</Label>
            <Select
              value={filters.organizationId}
              onValueChange={(value) =>
                setFilters({ ...filters, organizationId: value, projectId: '' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Projeto</Label>
            <Select
              value={filters.projectId}
              onValueChange={(value) => setFilters({ ...filters, projectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {filteredProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Horas</p>
              <p className="text-2xl font-bold">{filteredData.totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-success">
              <DollarSign className="h-5 w-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">
                R$ {filteredData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <FolderKanban className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Projetos</p>
              <p className="text-2xl font-bold">{filteredData.projectData.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Building2 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organizações</p>
              <p className="text-2xl font-bold">
                {new Set(filteredData.projectData.map((p) => p.organizationName)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {filteredData.projectData.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Nenhum dado encontrado"
          description="Ajuste os filtros ou adicione tarefas para visualizar o relatório."
        />
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="table-header">Projeto</TableHead>
                <TableHead className="table-header">Organização</TableHead>
                <TableHead className="table-header">Valor/Hora</TableHead>
                <TableHead className="table-header">Horas</TableHead>
                <TableHead className="table-header">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.projectData.map((project) => (
                <TableRow key={project.projectId}>
                  <TableCell className="font-medium">{project.projectName}</TableCell>
                  <TableCell className="text-muted-foreground">{project.organizationName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    R$ {project.hourlyRate.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-primary">{project.hours.toFixed(1)}h</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-success">
                      R$ {project.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={3}>TOTAL</TableCell>
                <TableCell className="text-primary">{filteredData.totalHours.toFixed(1)}h</TableCell>
                <TableCell className="text-success">
                  R$ {filteredData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Period Info */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Período: {format(new Date(filters.startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} até{' '}
        {format(new Date(filters.endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>
    </div>
  );
}
