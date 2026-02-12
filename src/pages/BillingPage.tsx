import { useMemo, useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

const fmtCurrency = (value: number, show: boolean) =>
  show ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••';

const BillingPage = () => {
  const { tasksQuery } = useTasks();
  const { projectsQuery } = useProjects();
  const tasks = useMemo(() => tasksQuery.data || [], [tasksQuery.data]);
  const projects = useMemo(() => projectsQuery.data || [], [projectsQuery.data]);
  const [showValues, setShowValues] = useState(true);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(now.getFullYear().toString());
  const [forecastMonths, setForecastMonths] = useState<string>('3');

  // Available years based on task data + current year
  const availableYears = useMemo(() => {
    const years = new Set<number>([now.getFullYear()]);
    tasks.forEach((t) => years.add(new Date(t.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [tasks, now]);

  // ---------- HISTORICAL DATA ----------
  // All monthly revenue from actual tasks
  const allMonthlyRevenue = useMemo(() => {
    const revenue = new Map<string, number>();
    tasks.forEach((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      if (!project) return;
      const key = format(new Date(task.date), 'yyyy-MM');
      const value = (revenue.get(key) ?? 0) + project.hourlyRate * task.hours;
      revenue.set(key, value);
    });
    return revenue;
  }, [projects, tasks]);

  // Filtered historical data
  const filteredRevenue = useMemo(() => {
    const entries = Array.from(allMonthlyRevenue.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    return entries.filter(([monthKey]) => {
      const [y, m] = monthKey.split('-');
      if (filterYear !== 'all' && y !== filterYear) return false;
      if (filterMonth !== 'all' && String(parseInt(m, 10) - 1) !== filterMonth) return false;
      return true;
    });
  }, [allMonthlyRevenue, filterMonth, filterYear]);

  // ---------- FORECAST ----------
  // Average monthly revenue from all historical data (for projection)
  const avgMonthlyRevenue = useMemo(() => {
    const values = Array.from(allMonthlyRevenue.values());
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }, [allMonthlyRevenue]);

  // Build chart data: historical + forecast
  const chartData = useMemo(() => {
    const numForecast = parseInt(forecastMonths, 10);
    const historical: { month: string; value: number | null; forecast: number | null; type: 'real' | 'forecast' }[] =
      filteredRevenue.map(([month, value]) => ({
        month: format(new Date(`${month}-01`), 'MMM/yy', { locale: ptBR }),
        value,
        forecast: null,
        type: 'real' as const,
      }));

    // Only add forecast if not filtering a specific past month
    if (filterMonth === 'all' && numForecast > 0) {
      // Find the last month in the data, or use current month
      const lastMonthKey = filteredRevenue.length > 0
        ? filteredRevenue[filteredRevenue.length - 1][0]
        : format(now, 'yyyy-MM');

      const lastDate = new Date(`${lastMonthKey}-01`);

      // Use a weighted average: more recent months count more
      const allSorted = Array.from(allMonthlyRevenue.entries()).sort(([a], [b]) => a.localeCompare(b));
      let weightedAvg = avgMonthlyRevenue;
      if (allSorted.length >= 3) {
        const last3 = allSorted.slice(-3);
        const recentAvg = last3.reduce((sum, [, v]) => sum + v, 0) / 3;
        weightedAvg = recentAvg * 0.7 + avgMonthlyRevenue * 0.3; // 70% recent, 30% overall
      }

      // Bridge: if historical has data, connect forecast to last real point
      if (historical.length > 0) {
        historical[historical.length - 1].forecast = historical[historical.length - 1].value;
      }

      for (let i = 1; i <= numForecast; i++) {
        const futureDate = addMonths(lastDate, i);
        // Check if this future month already has real data
        const futureKey = format(futureDate, 'yyyy-MM');
        const existingValue = allMonthlyRevenue.get(futureKey);

        if (existingValue !== undefined) {
          historical.push({
            month: format(futureDate, 'MMM/yy', { locale: ptBR }),
            value: existingValue,
            forecast: null,
            type: 'real',
          });
        } else {
          // Apply slight random variation (±5%) for realistic forecast
          const variation = 1 + (Math.random() * 0.1 - 0.05);
          historical.push({
            month: format(futureDate, 'MMM/yy', { locale: ptBR }),
            value: null,
            forecast: Math.round(weightedAvg * variation * 100) / 100,
            type: 'forecast',
          });
        }
      }
    }

    return historical;
  }, [filteredRevenue, forecastMonths, filterMonth, allMonthlyRevenue, avgMonthlyRevenue, now]);

  // ---------- SUMMARY STATS ----------
  const totalFiltered = filteredRevenue.reduce((sum, [, v]) => sum + v, 0);
  const forecastTotal = chartData
    .filter((d) => d.type === 'forecast')
    .reduce((sum, d) => sum + (d.forecast ?? 0), 0);

  const topProjects = useMemo(() => {
    const revenueMap = new Map<string, { name: string; value: number }>();

    // Filter tasks by selected period
    tasks.forEach((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      if (!project) return;
      const taskDate = new Date(task.date);
      const y = taskDate.getFullYear().toString();
      const m = String(taskDate.getMonth());

      if (filterYear !== 'all' && y !== filterYear) return;
      if (filterMonth !== 'all' && m !== filterMonth) return;

      const key = project.id;
      const current = revenueMap.get(key) ?? { name: project.name, value: 0 };
      current.value += project.hourlyRate * task.hours;
      revenueMap.set(key, current);
    });
    return Array.from(revenueMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [projects, tasks, filterMonth, filterYear]);

  const filterLabel = filterMonth === 'all'
    ? filterYear === 'all' ? 'Todo o período' : `Ano ${filterYear}`
    : `${MONTHS[parseInt(filterMonth, 10)]?.label}/${filterYear}`;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Faturamento"
        description="Acompanhe a previsão de receitas e exporte informações para seu financeiro."
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              Exportar CSV
            </Button>
            <Button size="sm" variant="ghost" className="gap-2" onClick={() => setShowValues((prev) => !prev)}>
              {showValues ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Ocultar</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Mostrar</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground shrink-0">Filtros:</span>

          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {availableYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden sm:block h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground shrink-0">Previsão:</span>
            <Select value={forecastMonths} onValueChange={setForecastMonths}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sem previsão</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={cn('grid gap-4', forecastTotal > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
        <div className="card-elevated border border-border p-4">
          <p className="text-sm text-muted-foreground">{filterLabel}</p>
          <p className="text-3xl font-bold text-foreground">{fmtCurrency(totalFiltered, showValues)}</p>
          <p className="text-xs text-muted-foreground">Receita realizada</p>
        </div>
        <div className="card-elevated border border-border p-4">
          <p className="text-sm text-muted-foreground">Média mensal</p>
          <p className="text-3xl font-bold text-foreground">
            {fmtCurrency(filteredRevenue.length > 0 ? totalFiltered / filteredRevenue.length : 0, showValues)}
          </p>
          <p className="text-xs text-muted-foreground">
            {filteredRevenue.length > 0 ? `Base: ${filteredRevenue.length} meses` : 'Sem dados'}
          </p>
        </div>
        <div className="card-elevated border border-border p-4">
          <p className="text-sm text-muted-foreground">Projetos ativos</p>
          <p className="text-3xl font-bold text-foreground">{topProjects.length}</p>
          <p className="text-xs text-muted-foreground">Com faturamento no período</p>
        </div>
        {forecastTotal > 0 && (
          <div className="card-elevated border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-primary">Previsão futura</p>
            <p className="text-3xl font-bold text-primary">{fmtCurrency(forecastTotal, showValues)}</p>
            <p className="text-xs text-muted-foreground">
              Próximos {forecastMonths} meses (estimativa)
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="card-elevated p-4 sm:p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-foreground">Receita × Previsão</p>
            <p className="text-xs text-muted-foreground">
              Valores reais em azul • Previsão em roxo pontilhado
            </p>
          </div>
        </div>
        <div className="h-64 sm:h-72">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhum dado para o período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => showValues ? `R$${(value / 1000).toFixed(0)}k` : '••'}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number, name: string) => [
                    fmtCurrency(value, showValues),
                    name === 'forecast' ? 'Previsão' : 'Realizado',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  connectNulls={false}
                  name="Realizado"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(243, 75%, 59%)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#colorForecast)"
                  connectNulls
                  name="Previsão"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Projects */}
      <div className="card-elevated border border-border p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-lg font-semibold text-foreground">Ranking por projeto</p>
          <p className="text-xs text-muted-foreground">
            {filterLabel} — projetos com maior faturamento
          </p>
        </div>
        <div className="space-y-3">
          {topProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum faturamento no período selecionado. Ajuste os filtros ou registre novas tarefas.
            </p>
          ) : (
            topProjects.map((project, i) => {
              const maxValue = topProjects[0]?.value ?? 1;
              const pct = (project.value / maxValue) * 100;
              return (
                <div key={project.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-muted-foreground mr-2">#{i + 1}</span>
                      {project.name}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {fmtCurrency(project.value, showValues)}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
