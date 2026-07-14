import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "blackWhiteText";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClasses =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border-0 font-medium";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white",
  secondary: "bg-gray-100 text-gray-700",
  ghost: "bg-transparent text-gray-500",
  outline: "border border-white/30 bg-transparent text-white",
  blackWhiteText: "bg-black text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-[11.5px]",
  md: "px-3.5 py-2 text-[13px]",
  lg: "px-5 py-2.5 text-sm",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
