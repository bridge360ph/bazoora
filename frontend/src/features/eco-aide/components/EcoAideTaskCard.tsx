import type { EcoAideTask } from "../ecoAide.types";

type EcoAideTaskCardProps = {
  task: EcoAideTask;
};

export function EcoAideTaskCard({ task }: EcoAideTaskCardProps) {
  return (
    <article className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{task.title}</h3>
          <p className="text-sm text-gray-600">{task.location}</p>
        </div>

        <span className="rounded-full border px-3 py-1 text-xs">
          {task.status}
        </span>
      </div>

      <div className="mt-3 text-sm">
        <p>Waste Type: {task.wasteType}</p>
        <p>Fee Status: {task.feeStatus}</p>
      </div>
    </article>
  );
}