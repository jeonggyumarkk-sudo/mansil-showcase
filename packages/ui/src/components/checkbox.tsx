import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, className = '', id, ...props }, ref) => {
        return (
            <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer">
                <input
                    ref={ref}
                    type="checkbox"
                    id={id}
                    className={`mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer ${className}`}
                    {...props}
                />
                {label && <span className="text-sm text-gray-700 select-none">{label}</span>}
            </label>
        );
    }
);
Checkbox.displayName = 'Checkbox';
