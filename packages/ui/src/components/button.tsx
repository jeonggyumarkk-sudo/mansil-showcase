import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

        const variants = {
            primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
            secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
            ghost: "bg-transparent text-primary-600 hover:bg-primary-50",
            outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-11 px-6 text-sm", // matching design spec (padding 12px 24px -> close to h-11)
            lg: "h-12 px-8 text-base",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";
