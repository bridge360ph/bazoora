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
  /**
   * True while the action this button started is still running. The button
   * shows a spinner and is disabled, so it is clear the click registered and
   * it cannot be sent twice.
   */
  loading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md border-0 font-medium transition";

// Pressing a button gives immediate visual feedback, before any network
// response, so clicks never feel ignored.
const pressClasses = "motion-safe:active:scale-[0.97] active:brightness-95";

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

export function Spinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  loading = false,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${
          loading
            ? "cursor-wait opacity-80"
            : disabled
              ? "cursor-not-allowed opacity-50"
              : `cursor-pointer ${pressClasses}`
        }
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
