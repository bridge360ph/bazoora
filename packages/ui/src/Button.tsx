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

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#1a3a2e] text-white",
  secondary: "bg-[#f3f4f6] text-[#374151]",
  ghost: "bg-transparent text-[#6b7280]",
  outline: "border border-[rgba(255,255,255,0.3)] bg-transparent text-white",
  blackWhiteText: "bg-black text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-[11.5px]",
  md: "px-[14px] py-2 text-[13px]",
  lg: "px-5 py-2.5 text-[14px]",
};

const baseStyle =
  "border-none rounded-md cursor-pointer font-medium inline-flex items-center justify-center gap-2";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  style,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      style={style}
      className={`
        ${baseStyle}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}