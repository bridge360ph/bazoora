import type { ReactNode } from "react";

/**
 * Page frame for every admin screen, matching Hauling Request Management:
 * the surface background, a centred column, and white panels inside it.
 *
 * `fill` pages (lists) keep the panel at full height and scroll inside it.
 * Other pages (dashboard, analytics, settings) scroll as a whole.
 */
export function AdminPage({
  children,
  fill = false,
}: {
  children: ReactNode;
  fill?: boolean;
}): ReactNode {
  return (
    <div
      className={`h-full min-h-0 min-w-0 flex-1 bg-surface p-5 ${
        fill ? "overflow-hidden" : "overflow-y-auto"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-350 flex-col gap-5 ${fill ? "h-full" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

/** The white rounded panel used for lists, forms and sections. */
export function AdminPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <section
      className={`flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * A panel heading: small caps eyebrow, bold title and optional actions on the
 * right, separated from the content by a thin line.
 */
export function AdminPanelHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}): ReactNode {
  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-6 pb-4 pt-5">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold tracking-wider text-gray-400">{eyebrow}</p>
        )}
        <h2 className="mt-0.5 text-base font-bold text-gray-800">{title}</h2>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
