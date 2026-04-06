import { collection, writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const seedDemoData = async (userId: string) => {
  const batch = writeBatch(db);

  // Today
  const today = new Date();
  
  // Create 5 workouts spanning the last month
  const workoutDates = [
    new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000), // 4 weeks ago
    new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),  // 1 week ago
    today, // Today
  ];

  // Progressive overload weights to show progress
  const squatWeights = [80, 85, 90, 95, 100];
  const benchWeights = [60, 62.5, 65, 67.5, 70];
  const deadliftWeights = [100, 105, 110, 115, 120];

  workoutDates.forEach((date, index) => {
    const workoutRef = doc(collection(db, "workouts"));
    
    // Create entries for each day
    const entries = [
      // Squat 3x5
      { movement: "Squat", weight: squatWeights[index], reps: 5, rpe: 8, notes: "Felt strong" },
      { movement: "Squat", weight: squatWeights[index], reps: 5, rpe: 8.5 },
      { movement: "Squat", weight: squatWeights[index], reps: 5, rpe: 9, notes: "Last rep was a grinder" },
      // Bench Press 3x5
      { movement: "Bench Press", weight: benchWeights[index], reps: 5, rpe: 8 },
      { movement: "Bench Press", weight: benchWeights[index], reps: 5, rpe: 8.5 },
      { movement: "Bench Press", weight: benchWeights[index], reps: 5, rpe: 9 },
      // Deadlift 1x5
      { movement: "Deadlift", weight: deadliftWeights[index], reps: 5, rpe: 9, notes: "Heavy" },
    ];

    batch.set(workoutRef, {
      userId,
      date: Timestamp.fromDate(date),
      entries,
      createdAt: Timestamp.fromDate(date),
    });
  });

  // Also add some templates
  const templates = [
    { name: "Heavy Squat", movement: "Squat", weight: 100, reps: 5 },
    { name: "Bench Press", movement: "Bench Press", weight: 70, reps: 5 },
    { name: "Deadlift Work", movement: "Deadlift", weight: 120, reps: 5 },
  ];

  templates.forEach(t => {
    const templateRef = doc(collection(db, "templates"));
    batch.set(templateRef, {
      ...t,
      userId,
      createdAt: Timestamp.now()
    });
  });

  await batch.commit();
};
