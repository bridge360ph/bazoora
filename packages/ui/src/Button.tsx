import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
  outline: "border border-white/30 bg-transparent text-white hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-3.5 py-2 text-sm",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}