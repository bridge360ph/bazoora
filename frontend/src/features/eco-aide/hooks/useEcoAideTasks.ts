import { useEffect, useState } from "react";
import { getEcoAideTasks } from "../ecoAideService";
import type { EcoAideTask } from "../ecoAide.types";

export function useEcoAideTasks() {
  const [tasks, setTasks] = useState<EcoAideTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      const taskData = await getEcoAideTasks();

      setTasks(taskData);
      setIsLoading(false);
    }

    loadTasks();
  }, []);

  return {
    tasks,
    isLoading,
  };
}