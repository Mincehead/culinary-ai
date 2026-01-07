import React from 'react';

export const LumiereLogo: React.FC<React.SVGProps<SVGSVGElement>> = ({ className = "w-16 h-16", ...props }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Lumière Culinary Logo"
            {...props}
        >
            <path
                d="M25 75 C 25 75, 20 85, 30 85 L 80 85 C 90 85, 90 75, 80 75 L 30 75 Z"
                fill="#1a1a1a"
                className="opacity-90"
            />
            <path
                d="M35 70 Q 30 40 45 30 Q 60 20 65 10 Q 70 30 60 40 Q 55 45 60 55 L 75 70 Z"
                fill="currentColor"
                className="text-culinary-gold"
            />
            <path
                d="M85 25 L 60 55 L 40 55 L 30 70 L 80 70 L 95 35 Q 98 30 85 25 Z"
                fill="#d4af37"
            />

        </svg>
    );
};
