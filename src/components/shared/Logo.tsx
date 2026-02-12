interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

/**
 * Professional PJ Manager logo — stylized "PJ" monogram inside a rounded square
 * with gradient background. Designed for sidebar, top bar, login, and favicon use.
 */
export function Logo({ size = 40, className = '', showText = false, textClassName = '' }: LogoProps) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
            >
                {/* Rounded square background with gradient */}
                <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="hsl(226, 71%, 52%)" />
                        <stop offset="100%" stopColor="hsl(243, 75%, 59%)" />
                    </linearGradient>
                    <linearGradient id="accent-gradient" x1="0" y1="16" x2="48" y2="32" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>

                {/* Background shape */}
                <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#logo-gradient)" />

                {/* Subtle glass shine */}
                <rect x="0" y="0" width="48" height="24" rx="12" fill="url(#accent-gradient)" />

                {/* "P" letter */}
                <path
                    d="M12 12h7.5c3.5 0 6 2.5 6 6s-2.5 6-6 6H16.5V36H12V12z"
                    fill="white"
                    opacity="0.95"
                />
                {/* "P" inner cutout */}
                <path
                    d="M16.5 16.5h3c1.4 0 2 .8 2 2s-.6 2-2 2h-3V16.5z"
                    fill="url(#logo-gradient)"
                />

                {/* "J" letter */}
                <path
                    d="M28 12h4.5v18c0 4-2.2 6.5-5.5 6.5-2 0-3.5-.8-4.5-2l3-3c.4.5 1 .8 1.5.8 1.2 0 1.5-1 1.5-2.3V12z"
                    fill="white"
                    opacity="0.95"
                />

                {/* Decorative accent dot */}
                <circle cx="38" cy="12" r="2.5" fill="rgba(255,255,255,0.5)" />
            </svg>

            {showText && (
                <div className={textClassName}>
                    <h1 className="text-lg font-bold text-foreground leading-tight">PJ Manager</h1>
                    <p className="text-xs text-muted-foreground leading-tight">Gestão Inteligente</p>
                </div>
            )}
        </div>
    );
}

/**
 * Small icon-only version for compact spaces (favicon, mobile top bar, etc.)
 */
export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
    return <Logo size={size} className={className} />;
}
