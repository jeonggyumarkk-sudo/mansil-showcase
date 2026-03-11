import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'available' | 'occupied' | 'verified' | 'new' | 'default';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const variants = {
            available: "bg-emerald-100 text-emerald-800", // Green for empty
            occupied: "bg-gray-100 text-gray-700",       // Gray for occupied
            verified: "bg-blue-100 text-blue-800",       // Blue for verified
            new: "bg-purple-100 text-purple-800",        // Purple for new
            default: "bg-gray-100 text-gray-800",
        };

        return (
            <span
                ref={ref}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-tight ${variants[variant]} ${className}`}
                {...props}
            />
        );
    }
);
Badge.displayName = "Badge";
