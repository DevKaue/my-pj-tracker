import { StatCard } from '@/components/dashboard/StatCard';
import { useOrganizations, useProjects, useTasks } from '@/hooks/useData';
import { AlertTriangle, Clock, Building2, Eye, EyeOff, FolderKanban, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { organizationsQuery } = useOrganizations();
  const { projectsQuery } = useProjects();
  const { tasksQuery } = useTasks();

  const organizations = useMemo(() => organizationsQuery.data || [], [organizationsQuery.data]);
  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);
  const tasks = useMemo(() => tasksQuery.data || [], [tasksQuery.data]);
  const [showBillingValue, setShowBillingValue] = useState(true);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthlyTasks = tasks.filter((task) => isWithinInterval(new Date(task.date), { start, end }));

    const totalHours = monthlyTasks.reduce((sum, task) => sum + task.hours, 0);
    const totalValue = monthlyTasks.reduce((sum, task) => {
      const project = projects.find((p) => p.id === task.projectId);
      return sum + task.hours * (project?.hourlyRate || 0);
    }, 0);

    const completedTasks = monthlyTasks.filter((t) => t.status === 'completed').length;

    return { totalHours, totalValue, completedTasks, totalTasks: monthlyTasks.length };
  }, [tasks, projects]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(
      (task) =>
        task.status === 'late' || (task.status !== 'completed' && task.dueDate < now),
    );
  }, [tasks]);

  const billingValueLabel = showBillingValue
    ? `R$ ${monthlyStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : '••••••••••';

  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [tasks]);

  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name || 'Desconhecido';

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Bem-vindo ao PJ Manager</h1>
        <p className="mt-1 text-muted-foreground">
          Seu painel de controle para gestão de projetos e horas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Horas este mês"
          value={`${monthlyStats.totalHours.toFixed(1)}h`}
          subtitle={format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          icon={<Clock className="h-6 w-6" />}
          variant="primary"
        />
        <div className="relative">
          <StatCard
            title="Faturamento"
            value={billingValueLabel}
            subtitle="Previsão do mês"
            icon={<DollarSign className="h-6 w-6" />}
            variant="success"
          />
          <Button
            size="xs"
            variant="ghost"
            className="absolute right-3 top-3 text-xs"
            onClick={() => setShowBillingValue((prev) => !prev)}
          >
            {showBillingValue ? (
              <>
                <EyeOff className="h-3 w-3" />
                <span>Ocultar</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                <span>Mostrar</span>
              </>
            )}
          </Button>
        </div>
        <StatCard
          title="Projetos ativos"
          value={activeProjects}
          subtitle={`De ${projects.length} total`}
          icon={<FolderKanban className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Organizações"
          value={organizations.length}
          subtitle="Clientes cadastrados"
          icon={<Building2 className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ações Rápidas
          </h2>
          <div className="grid gap-3">
            <Link to="/tasks">
              <Button variant="outline" className="w-full justify-start gap-3 h-14">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Registrar Horas</p>
                  <p className="text-xs text-muted-foreground">Adicione uma nova tarefa</p>
                </div>
              </Button>
            </Link>
            <Link to="/projects">
              <Button variant="outline" className="w-full justify-start gap-3 h-14">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <FolderKanban className="h-4 w-4 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Novo Projeto</p>
                  <p className="text-xs text-muted-foreground">Crie um projeto para uma organização</p>
                </div>
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" className="w-full justify-start gap-3 h-14">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-warning">
                  <DollarSign className="h-4 w-4 text-warning-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Gerar Relatório</p>
                  <p className="text-xs text-muted-foreground">Exporte dados para sua NF</p>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Tarefas Recentes
          </h2>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma tarefa registrada</p>
              <Link to="/tasks">
                <Button variant="link" className="mt-2">
                  Registrar primeira tarefa
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {getProjectName(task.projectId)} • {format(new Date(task.date), 'dd/MM', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Clock className="h-4 w-4" />
                    {task.hours}h
                  </div>
                </div>
              ))}
              <Link to="/tasks">
                <Button variant="ghost" className="w-full mt-2">
                  Ver todas as tarefas
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="card-elevated border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-destructive">Tarefas atrasadas</p>
              <p className="text-sm text-muted-foreground">
                {overdueTasks.length === 0
                  ? 'Nenhuma tarefa em atraso no momento.'
                  : `${overdueTasks.length} tarefa(s) precisando de atenção`}
              </p>
            </div>
            <Link to="/tasks">
              <Button variant="outline" size="sm" className="gap-1">
                <AlertTriangle className="h-4 w-4" />
                Ver todas
              </Button>
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {overdueTasks.length === 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
                Por enquanto está tudo em dia.
              </div>
            ) : (
              overdueTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-card/80 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-destructive">{task.title}</p>
                    <span className="text-xs font-semibold uppercase tracking-wide text-destructive">
                      {getProjectName(task.projectId)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data de entrega: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">Status atual: {task.status.replace('_', ' ')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-center">
            💡 <span className="font-medium">Dica:</span> Comece criando uma{' '}
            <Link to="/organizations" className="text-primary hover:underline">
              organização
            </Link>
            , depois um{' '}
            <Link to="/projects" className="text-primary hover:underline">
              projeto
            </Link>
            , e registre suas{' '}
            <Link to="/tasks" className="text-primary hover:underline">
              tarefas
            </Link>{' '}
            diariamente para relatórios precisos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
