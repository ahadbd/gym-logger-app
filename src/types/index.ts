import { z } from "zod";
import { Timestamp } from "firebase/firestore";

export const WorkoutEntrySchema = z.object({
  movement: z.string().min(1, "Movement name is required"),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
});

export type WorkoutEntry = z.infer<typeof WorkoutEntrySchema>;

export interface Workout {
  id?: string;
  date: Timestamp;
  entries: WorkoutEntry[];
  createdAt: Timestamp;
}
