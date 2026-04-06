"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Workout } from "@/types";
import WorkoutEntry from "./WorkoutEntry";
import { startOfDay, endOfDay } from "date-fns";
import { History, Calendar } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function WorkoutList() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!user) {
      setWorkout(null);
      setLoading(false);
      return;
    }

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Query for the latest workout doc for the current day and user
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", user.uid),
      where("date", ">=", Timestamp.fromDate(start)),
      where("date", "<=", Timestamp.fromDate(end)),
      orderBy("date", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setWorkout({ id: doc.id, ...doc.data() } as Workout);
      } else {
        setWorkout(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLoadDemoData = async () => {
    if (!user) return;
    try {
      setIsSeeding(true);
      const { seedDemoData } = await import("@/lib/seed");
      await seedDemoData(user.uid);
      // Data will automatically update via subscription
    } catch (error) {
      console.error("Error seeding data:", error);
      alert("Failed to load demo data");
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  if (!workout || workout.entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-3xl opacity-60">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
        <p className="text-muted-foreground mb-6">Start logging your workout for today!</p>
        <button
          onClick={handleLoadDemoData}
          disabled={isSeeding}
          className="px-6 py-2 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSeeding ? "Loading..." : "Load Demo Data"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3 text-white">
            <History className="w-8 h-8 text-primary" />
            TODAY&apos;S LOG
          </h2>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest pl-1">
            Session Overview
          </p>
        </div>
        <div className="px-4 py-2 bg-primary/20 text-primary border border-primary/20 rounded-full text-sm font-black tracking-widest uppercase glow">
          {workout.entries.length} Sets
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {workout.entries.map((entry, idx) => {
          // Calculate set number for this movement in this workout
          const movementSets = workout.entries
            .slice(0, idx + 1)
            .filter(e => e.movement.toLowerCase() === entry.movement.toLowerCase());
          
          return (
            <WorkoutEntry 
              key={idx} 
              entry={entry} 
              setNumber={movementSets.length} 
            />
          );
        })}
      </div>
    </div>
  );
}

