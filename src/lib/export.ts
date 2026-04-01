import { Workout } from "@/types";
import { format } from "date-fns";

export function exportWorkoutsToCSV(workouts: Workout[]) {
  if (!workouts || workouts.length === 0) return;

  const headers = ["Date", "Movement", "Reps", "Weight (kg)", "RPE", "1RM (EST)"];
  const rows = workouts.flatMap(workout => {
    const dateStr = format(workout.date.toDate(), "yyyy-MM-dd HH:mm");
    return workout.entries.map(entry => [
      dateStr,
      `"${entry.movement}"`,
      entry.reps,
      entry.weight,
      entry.rpe || "N/A",
      (entry.weight * (1 + entry.reps / 30)).toFixed(1)
    ]);
  });

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `gym_logger_export_${format(new Date(), "yyyy_MM_dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
