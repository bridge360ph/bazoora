import type { KeyboardEvent, ReactNode } from "react";

/**
 * A list row as a card, as on Hauling Request Management: a coloured left
 * edge for the status, details on the left and status and actions on the
 * right. Clicking the card opens it when `onOpen` is set.
 */
export function AdminListCard({
  accentClassName = "border-l-gray-300",
  onOpen,
  children,
  aside,
}: {
  /** Tailwind border-l colour, for example "border-l-emerald-400". */
  accentClassName?: string;
  onOpen?: () => void;
  children: ReactNode;
  aside?: ReactNode;
}): ReactNode {
  return (
    <div
      className={`group flex min-h-20 w-full shrink-0 items-center justify-between gap-4 rounded-md border border-l-2 border-gray-200 bg-white px-5 py-3 text-left transition hover:border-gray-300 hover:shadow-sm ${accentClassName} ${
        onOpen ? "cursor-pointer" : ""
      }`}
      {...(onOpen && {
        role: "button",
        tabIndex: 0,
        onClick: onOpen,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        },
      })}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {aside && (
        <div
          className="flex shrink-0 flex-col items-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          {aside}
        </div>
      )}
    </div>
  );
}

/** Small icon + text item for the meta line of a list card. */
export function AdminMeta({ icon, children }: { icon?: ReactNode; children: ReactNode }): ReactNode {
  return (
    <span className="flex min-w-0 items-center gap-1">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
