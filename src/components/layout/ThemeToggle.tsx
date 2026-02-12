import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
                'relative h-9 w-9 rounded-lg transition-all duration-300',
                className
            )}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            <Sun
                className={cn(
                    'h-4 w-4 transition-all duration-300',
                    isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
                )}
            />
            <Moon
                className={cn(
                    'absolute h-4 w-4 transition-all duration-300',
                    isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'
                )}
            />
        </Button>
    );
}
