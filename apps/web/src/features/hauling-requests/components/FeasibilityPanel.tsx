import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import type {
  FeasibilityRow,
  HaulingFeasibility,
} from "../hooks/useHaulingFeasibility";

const STATUS_ICON: Record<FeasibilityRow["status"], ReactNode> = {
  pass: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  warn: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  fail: <XCircle className="h-4 w-4 text-red-600" />,
  loading: <Loader2 className="h-4 w-4 animate-spin text-gray-400" />,
};

function summarize(feasibility: HaulingFeasibility): {
  text: string;
  className: string;
} {
  if (feasibility.isChecking) {
    return { text: "Checking...", className: "bg-gray-50 text-gray-600" };
  }

  if (feasibility.hasFailure) {
    return {
      text: "Not feasible yet. Fix the failed checks or reject the request.",
      className: "bg-red-50 text-red-700",
    };
  }

  if (feasibility.hasWarning) {
    return {
      text: "Feasible, with notes to review before approving.",
      className: "bg-amber-50 text-amber-800",
    };
  }

  return {
    text: "Feasible. The request can be approved.",
    className: "bg-green-50 text-green-700",
  };
}

/** The feasibility checks for a hauling request, one row per check. */
export function FeasibilityPanel({
  feasibility,
}: {
  feasibility: HaulingFeasibility;
}): ReactNode {
  const summary = summarize(feasibility);

  return (
    <div className="rounded-lg border border-surface-border">
      <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
        <p className="text-[10px] font-semibold tracking-wider text-gray-400">
          FEASIBILITY CHECK
        </p>
        <button
          type="button"
          onClick={feasibility.refetch}
          disabled={feasibility.isChecking}
          className="inline-flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-brand-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw className="h-3 w-3" />
          Check again
        </button>
      </div>

      <ul className="divide-y divide-surface-border">
        {feasibility.rows.map((row) => (
          <li key={row.key} className="flex items-start gap-2.5 px-3 py-2">
            <span className="mt-0.5 shrink-0">{STATUS_ICON[row.status]}</span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-gray-800">
                {row.label}
              </span>
              <span className="block text-xs text-gray-500">{row.message}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className={`px-3 py-2 text-xs font-medium ${summary.className}`}>
        {summary.text}
      </p>
    </div>
  );
}
