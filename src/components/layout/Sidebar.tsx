import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  Briefcase,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Organizações', href: '/organizations', icon: Building2 },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Faturamento', href: '/billing', icon: DollarSign },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">PJ Manager</h1>
            <p className="text-xs text-muted-foreground">Gestão Inteligente</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn('nav-item', isActive && 'active')}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">Dica do dia</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lembre-se de registrar suas horas diariamente para relatórios precisos.
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
}
