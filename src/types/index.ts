import { z } from "zod";
import { Timestamp } from "firebase/firestore";

export const WorkoutEntrySchema = z.object({
  movement: z.string().min(1, "Movement name is required"),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
  rpe: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
});

export type WorkoutEntry = z.infer<typeof WorkoutEntrySchema>;

export interface Workout {
  id?: string;
  userId: string;
  date: Timestamp;
  entries: WorkoutEntry[];
  createdAt: Timestamp;
}

export const TemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  movement: z.string().min(1, "Movement name is required"),
  reps: z.number().int().positive(),
  weight: z.number().nonnegative(),
});

export type Template = z.infer<typeof TemplateSchema> & {
  id: string;
  userId: string;
  createdAt: Timestamp;
};
