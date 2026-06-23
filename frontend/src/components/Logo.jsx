import React from 'react';

const Logo = ({ className = "h-10", showText = true }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* The Icon: Pin + Voice + Badge */}
            <div className="relative flex items-center justify-center aspect-square h-full shrink-0">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-full w-full drop-shadow-sm"
                >
                    {/* Base Location Pin (Local) */}
                    <path
                        d="M12 21.5C12 21.5 19.5 14.5 19.5 9.5C19.5 5.35786 16.1421 2 12 2C7.85786 2 4.5 5.35786 4.5 9.5C4.5 14.5 12 21.5 12 21.5Z"
                        className="fill-primary/10 stroke-primary"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Sound Wave Bars (Awaaz / Voice) */}
                    <path d="M9 8.5V11.5" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 7V13" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                    <path d="M15 8.5V11.5" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />

                    {/* Resolution Badge (Rewards/Tracking) */}
                    <g transform="translate(1, 1)">
                        {/* Background cutout to make it pop over the pin */}
                        <circle cx="17" cy="17" r="5.5" className="fill-background" />
                        {/* The Badge */}
                        <circle cx="17" cy="17" r="4.5" className="fill-accent" />
                        {/* The Checkmark */}
                        <path d="M15 17L16.5 18.5L19.5 15.5" className="stroke-white dark:stroke-background" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                </svg>
            </div>

            {/* The Text (Adaptive Typography) */}
            {showText && (
                <div className="flex flex-col justify-center select-none">
                    <span className="text-2xl font-bold font-display tracking-tight leading-none">
                        {/* text-foreground automatically flips black <-> white based on theme */}
                        <span className="text-foreground transition-colors duration-300">Local</span>
                        {/* text-primary keeps the brand color consistent */}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Awaaz</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;