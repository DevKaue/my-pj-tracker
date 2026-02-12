import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pjmanager-theme';

function getSystemTheme(): Theme {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function getStoredTheme(): Theme | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch { }
    return null;
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());

    const applyTheme = useCallback((t: Theme) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(t);
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        try { localStorage.setItem(STORAGE_KEY, t); } catch { }
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(STORAGE_KEY, next); } catch { }
            return next;
        });
    }, []);

    return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}
