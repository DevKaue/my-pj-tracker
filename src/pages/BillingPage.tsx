import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useProjects, useTasks } from '@/hooks/useData';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';

const BillingPage = () => {
  const { tasksQuery } = useTasks();
  const { projectsQuery } = useProjects();
  const tasks = useMemo(() => tasksQuery.data || [], [tasksQuery.data]);
  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);

  const monthlyRevenue = useMemo(() => {
    const revenue = new Map<string, number>();
    tasks.forEach((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      if (!project) return;
      const key = format(new Date(task.date), 'yyyy-MM');
      const value = (revenue.get(key) ?? 0) + project.hourlyRate * task.hours;
      revenue.set(key, value);
    });
    return Array.from(revenue.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, value]) => ({
        month: format(new Date(`${month}-01`), 'MMM/yyyy', { locale: ptBR }),
        value,
      }));
  }, [projects, tasks]);

  const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Faturamento"
        description="Acompanhe a previsão de receitas e exporte informações para seu financeiro."
        action={
          <Button variant="outline" className="gap-2">
            Exportar CSV
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-elevated border border-border p-4">
          <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
          <p className="text-3xl font-bold text-foreground">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">Média mensal</p>
        </div>
        <div className="card-elevated border border-border p-4">
          <p className="text-sm text-muted-foreground">Projetos faturados</p>
          <p className="text-3xl font-bold text-foreground">{projects.length}</p>
          <p className="text-xs text-muted-foreground">Projetos com tarefas faturáveis</p>
        </div>
        <div className="card-elevated border border-border p-4">
          <p className="text-sm text-muted-foreground">Tarefas registradas</p>
          <p className="text-3xl font-bold text-foreground">{tasks.length}</p>
          <p className="text-xs text-muted-foreground">Entradas acumuladas</p>
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Previsão mensal</p>
            <p className="text-xs text-muted-foreground">Valores baseados nas horas registradas e nos valores por hora</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Últimos {monthlyRevenue.length} meses
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Tooltip
                formatter={(value: number) =>
                  [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']
                }
              />
              <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
