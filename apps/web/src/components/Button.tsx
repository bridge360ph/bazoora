import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseStyle: CSSProperties = {
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "#1a3a2e",
    color: "#ffffff",
  },
  secondary: {
    background: "#f3f4f6",
    color: "#374151",
  },
  ghost: {
    background: "transparent",
    color: "#6b7280",
  },
  outline: {
    background: "transparent",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.3)",
  },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    padding: "4px 12px",
    fontSize: 11.5,
  },
  md: {
    padding: "8px 14px",
    fontSize: 13,
  },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  style,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}