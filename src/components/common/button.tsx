import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

// 버튼 형태별 스타일
const variantStyles = {
    primary: "bg-foreground text-background",
    secondary: "bg-surface text-foreground",
    outline: "border border-foreground text-foreground",
};

// 버튼 사이즈
const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
}

export default function Button({
    variant = "primary",
    size = "sm",
    className,
    children,
    ...props
}: ButtonProps) {
  return (
    <button
        className={clsx(
            "min-h-11 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
            variantStyles[variant],
            sizeStyles[size],
            className
        )}
        {...props}
        >
        {children}
    </button>
  );
}
