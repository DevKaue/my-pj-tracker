import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  Briefcase,
  DollarSign,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Organizações', href: '/organizations', icon: Building2 },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Faturamento', href: '/billing', icon: DollarSign },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">PJ Manager</h1>
                <p className="text-xs text-muted-foreground">Gestão Inteligente</p>
              </div>
            </div>
            {/* Close button — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn('nav-item', isActive && 'active')}
                >
                  <Icon className="h-5 w-5" />
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
            <div className="flex items-center gap-2">
              <ThemeToggle className="hidden lg:flex" />
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
