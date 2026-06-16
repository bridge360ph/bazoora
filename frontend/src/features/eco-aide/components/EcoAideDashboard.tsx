import { useEcoAideTasks } from "../hooks/useEcoAideTasks";
import { EcoAideTaskCard } from "./EcoAideTaskCard";

export function EcoAideDashboard() {
  const { tasks, isLoading } = useEcoAideTasks();

  if (isLoading) {
    return <p>Loading Eco-Aide tasks...</p>;
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <section className="mb-6">
        <h1 className="text-2xl font-bold">Eco-Aide Dashboard</h1>
        <p className="text-gray-600">
          View today&apos;s route, hauling queue, and assigned pickup tasks.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-600">Total Tasks</p>
          <p className="text-2xl font-bold">{tasks.length}</p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold">
            {tasks.filter((task) => task.status === "Pending").length}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold">
            {tasks.filter((task) => task.status === "Completed").length}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-semibold">Assigned Tasks</h2>

        <div className="grid gap-4">
          {tasks.map((task) => (
            <EcoAideTaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>
    </main>
  );
}