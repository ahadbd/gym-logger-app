"use client";

import { useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, Timestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WorkoutEntrySchema } from "@/types";
import { startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { Plus, Loader2, X, Dumbbell, Hash, Weight as WeightIcon } from "lucide-react";

export default function WorkoutForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [movement, setMovement] = useState("");
  const [reps, setReps] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user) return;

    setIsSubmitting(true);
    setError(null);

    const m = movement.trim();
    const r = Number(reps);
    const w = Number(weight);

    const result = WorkoutEntrySchema.safeParse({ movement: m, reps: r, weight: w });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setIsSubmitting(false);
      return;
    }

    try {
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);

      const q = query(
        collection(db, "workouts"),
        where("userId", "==", user.uid),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end)),
        limit(1)
      );

      const snapshot = await getDocs(q);

      // Success path starts here - we've determined what to do
      if (!snapshot.empty) {
        const workoutDoc = snapshot.docs[0];
        // Fire and forget (optimistic)
        updateDoc(workoutDoc.ref, {
          entries: arrayUnion(result.data),
        }).catch(err => console.error("BG_UPDATE_ERROR:", err));
      } else {
        // Fire and forget (optimistic)
        addDoc(collection(db, "workouts"), {
          userId: user.uid,
          date: Timestamp.fromDate(today),
          entries: [result.data],
          createdAt: Timestamp.now(),
        }).catch(err => console.error("BG_ADD_ERROR:", err));
      }


      // Optimistic Cleanup: Reset UI immediately
      setMovement("");
      setReps("");
      setWeight("");
      setIsSubmitting(false);
      setIsOpen(false);
      setError(null);
    } catch (err) {
      console.error("PRE_LOG_ERROR:", err);
      setError("Failed to initialize save. Please check your connection.");
      setIsSubmitting(false);
    }


  };



  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-5 rounded-[2rem] bg-primary text-white font-black text-xl tracking-tighter uppercase italic glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        <Plus className="w-6 h-6" />
        Log New Set
      </button>
    );
  }

  return (
    <div className="w-full glass rounded-[2.5rem] p-8 space-y-6 glow animate-slide-up border border-primary/20 relative">
      <button 
        onClick={() => setIsOpen(false)}
        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tighter text-white">NEW ENTRY</h2>
        <p className="text-sm font-bold text-primary uppercase tracking-widest">Detail your progress</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
            <Dumbbell className="w-3 h-3" /> Movement
          </label>
          <input
            type="text"
            placeholder="Bench Press"
            autoFocus
            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all text-white font-bold placeholder:text-white/20"
            value={movement}
            onChange={(e) => setMovement(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
              <Hash className="w-3 h-3" /> Reps
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all text-white font-bold"
              value={reps}
              onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
              <WeightIcon className="w-3 h-3" /> Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              placeholder="0.0"
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all text-white font-bold"
              value={weight}
              onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-red-400 px-4 py-2 bg-red-400/10 rounded-xl border border-red-400/20">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-5 rounded-2xl bg-primary text-white font-black text-lg tracking-widest uppercase italic shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Plus className="w-6 h-6" />
              <span>LOG SESSION</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

