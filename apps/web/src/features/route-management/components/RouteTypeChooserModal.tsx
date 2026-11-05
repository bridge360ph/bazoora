import type { ReactNode } from "react";
import { CalendarClock, ChevronRight, Truck } from "lucide-react";
import { Modal } from "@bazoora/ui";

export type RouteKind = "Free" | "Paid";

const OPTIONS: {
  kind: RouteKind;
  title: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    kind: "Free",
    title: "Free · Weekly garbage day",
    description:
      "The usual route that runs every week on a set day and time. Hauling requests are not needed.",
    icon: <CalendarClock className="h-5 w-5" />,
  },
  {
    kind: "Paid",
    title: "Paid · From a hauling request",
    description:
      "A one-time route for a single hauling request. Its pickup addresses become the checkpoints, and creating the route approves the request.",
    icon: <Truck className="h-5 w-5" />,
  },
];

/** The first step of Create Route: pick a Free or a Paid route. */
export function RouteTypeChooserModal({
  onChoose,
  onClose,
}: {
  onChoose: (kind: RouteKind) => void;
  onClose: () => void;
}): ReactNode {
  return (
    <Modal title="Create Route" onClose={onClose} width={560}>
      <p className="mb-4 text-sm text-gray-500">What kind of route is this?</p>

      <div className="flex flex-col gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.kind}
            type="button"
            onClick={() => onChoose(option.kind)}
            className="group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand hover:bg-brand/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-brand group-hover:text-white">
              {option.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-gray-900">
                {option.title}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                {option.description}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-brand" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
