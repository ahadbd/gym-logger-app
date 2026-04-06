import { Workout, WorkoutEntry } from "@/types";
import { format, eachDayOfInterval, subDays, isSameDay } from "date-fns";
import { collection, query, where, orderBy, getDocs, limit, setDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export type VolumeData = {
  date: string;
  volume: number;
};

export type MuscleData = {
  subject: string;
  value: number;
  fullMark: number;
};

const MUSCLE_GROUPS: Record<string, string[]> = {
  "Chest": ["bench", "chest", "fly", "pec", "pushup", "dip"],
  "Back": ["row", "pull", "lat", "deadlift", "back", "chin", "shrug"],
  "Legs": ["squat", "leg", "lung", "calf", "quad", "ham", "press"],
  "Shoulders": ["shoulder", "press", "delt", "raise", "lateral"],
  "Arms": ["curl", "tricep", "bicep", "arm", "extension", "skull"],
  "Core": ["abs", "core", "plank", "crunch", "situp", "leg raise"],
};

export function getMuscleGroup(movement: string): string {
  const m = movement.toLowerCase();
  for (const [group, keywords] of Object.entries(MUSCLE_GROUPS)) {
    if (keywords.some(k => m.includes(k))) return group;
  }
  return "Other";
}

export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Number((weight * (1 + reps / 30)).toFixed(1));
}

export function processVolumeTrends(workouts: Workout[], days: number = 7): VolumeData[] {
  const end = new Date();
  const start = subDays(end, days - 1);
  const interval = eachDayOfInterval({ start, end });

  return interval.map(day => {
    const dayWorkouts = workouts.filter(w => isSameDay(w.date.toDate(), day));
    const totalVolume = dayWorkouts.reduce((acc, w) => {
      return acc + w.entries.reduce((eAcc, e) => eAcc + (e.weight * e.reps), 0);
    }, 0);

    return {
      date: format(day, "MMM dd"),
      volume: totalVolume,
    };
  });
}

export function processMuscleDistribution(workouts: Workout[]): MuscleData[] {
  const distribution: Record<string, number> = {
    "Chest": 0,
    "Back": 0,
    "Legs": 0,
    "Shoulders": 0,
    "Arms": 0,
    "Core": 0,
  };

  workouts.forEach(w => {
    w.entries.forEach(e => {
      const group = getMuscleGroup(e.movement);
      if (distribution[group] !== undefined) {
        distribution[group]++;
      }
    });
  });

  const max = Math.max(...Object.values(distribution), 10);

  return Object.entries(distribution).map(([subject, value]) => ({
    subject,
    value,
    fullMark: max,
  }));
}

export function getPerformanceMetrics(workouts: Workout[]) {
  const last7Days = workouts.filter(w => w.date.toDate() > subDays(new Date(), 7));
  const totalVolume = last7Days.reduce((acc, w) => {
    return acc + w.entries.reduce((eAcc, e) => eAcc + (e.weight * e.reps), 0);
  }, 0);

  let peak1RM = 0;
  let totalRPE = 0;
  let rpeCount = 0;

  workouts.forEach(w => {
    w.entries.forEach(e => {
      const e1rm = calculate1RM(e.weight, e.reps);
      if (e1rm > peak1RM) peak1RM = e1rm;
      
      if (e.rpe) {
        totalRPE += e.rpe;
        rpeCount++;
      }
    });
  });

  const consistency = Math.min(100, (workouts.length / 12) * 100); // 3x a week goal over 4 weeks
  const avgRPE = rpeCount > 0 ? Number((totalRPE / rpeCount).toFixed(1)) : 0;

  return {
    totalVolume,
    peak1RM,
    avgRPE,
    consistency: Math.round(consistency),
  };
}

export async function getSuggestedPerformance(userId: string, movement: string) {
  if (!movement) return null;
  
  try {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(20) // Scan recent 20 workouts
    );

    const snapshot = await getDocs(q);
    const m = movement.toLowerCase();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const entries = data.entries || [] as WorkoutEntry[];
      // Find the most recent entry for this movement
      const match = entries.find((e: WorkoutEntry) => e.movement.toLowerCase() === m);
      
      if (match) {
        // RPE-Driven Progression: If last set was too easy (<= 6), jump +5kg instead of +2.5kg
        const lastRPE = match.rpe || 8;
        const weightJump = lastRPE <= 6 ? 5 : 2.5;
        
        const suggestedWeight = match.weight + weightJump;
        const suggestedReps = match.reps;

        return {
          lastWeight: match.weight,
          lastReps: match.reps,
          lastRPE,
          suggestedWeight,
          suggestedReps,
        };
      }
    }
  } catch (err) {
    console.error("SUGGESTION_ERROR:", err);
  }
  return null;
}

export async function updateLeaderboardEntry(user: User) {
  if (!user) return;

  try {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const workouts = snapshot.docs.map(doc => doc.data()) as Workout[];
    
    let peak1RM = 0;
    workouts.forEach(w => {
      w.entries.forEach((e: WorkoutEntry) => {
        const e1rm = calculate1RM(e.weight, e.reps);
        if (e1rm > peak1RM) peak1RM = e1rm;
      });
    });

    // Update global leaderboard collection
    await setDoc(doc(db, "leaderboard", user.uid), {
      userId: user.uid,
      displayName: user.displayName || "Elite Lifter",
      photoURL: user.photoURL || null,
      peak1RM: Math.round(peak1RM),
      totalSessions: snapshot.size, // Approximate
      lastActive: Timestamp.now(),
    }, { merge: true });

  } catch (err) {
    console.error("LEADERBOARD_UPDATE_ERROR:", err);
  }
}
