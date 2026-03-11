import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', hoverable = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${hoverable ? 'cursor-pointer' : ''
                    } ${className}`}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";
