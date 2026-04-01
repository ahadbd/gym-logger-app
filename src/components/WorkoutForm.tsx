"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, arrayUnion, Timestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WorkoutEntrySchema } from "@/types";
import { startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { getSuggestedPerformance, updateLeaderboardEntry } from "@/lib/analytics";
import { Plus, Loader2, X, Dumbbell, Hash, Weight as WeightIcon, ArrowUpRight, Activity, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface WorkoutFormProps {
  onLogSuccess?: () => void;
  onPR?: (data: { movement: string; type: "weight" | "1rm"; old: number; new: number }) => void;
}

export default function WorkoutForm({ onLogSuccess, onPR }: WorkoutFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [movement, setMovement] = useState("");
  const [reps, setReps] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [rpe, setRpe] = useState<number>(8); // Default to a standard training RPE
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    lastWeight: number;
    lastReps: number;
    suggestedWeight: number;
    suggestedReps: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Smart Suggestion Logic
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (movement.length < 3) {
      setSuggestion(null);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      if (user) {
        const result = await getSuggestedPerformance(user.uid, movement);
        setSuggestion(result as any);
      }
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [movement, user]);

  const applySuggestion = () => {
    if (suggestion) {
      setWeight(suggestion.suggestedWeight);
      setReps(suggestion.suggestedReps);
    }
  };

  const calculate1RM = (w: number, r: number) => {
    if (r === 1) return w;
    return Number((w * (1 + r / 30)).toFixed(1));
  };

  const checkPR = async (m: string, w: number, r: number) => {
    if (!user) return;
    try {
      // Query for previous workouts containing this movement
      const q = query(
        collection(db, "workouts"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        limit(50) // Check recent history for comparison
      );

      const snapshot = await getDocs(q);
      let bestWeight = 0;
      let best1RM = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        data.entries.forEach((entry: any) => {
          if (entry.movement.toLowerCase() === m.toLowerCase()) {
            const e1rm = calculate1RM(entry.weight, entry.reps);
            if (entry.weight > bestWeight) bestWeight = entry.weight;
            if (e1rm > best1RM) best1RM = e1rm;
          }
        });
      });

      const current1RM = calculate1RM(w, r);

      if (bestWeight > 0 && w > bestWeight) {
        onPR?.({ movement: m, type: "weight", old: bestWeight, new: w });
      } else if (best1RM > 0 && current1RM > best1RM) {
        onPR?.({ movement: m, type: "1rm", old: best1RM, new: current1RM });
      }
    } catch (err) {
      console.error("PR_CHECK_ERROR:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user) return;

    setIsSubmitting(true);
    setError(null);

    const m = movement.trim();
    const r = Number(reps);
    const w = Number(weight);
    const rpeValue = rpe;
    const n = notes.trim() || undefined;

    const result = WorkoutEntrySchema.safeParse({ movement: m, reps: r, weight: w, rpe: rpeValue, notes: n });
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

      // Check for PR before clearing
      await checkPR(m, w, r);

      // Sync with global leaderboard
      updateLeaderboardEntry(user);

      // Optimistic Cleanup: Reset UI immediately
      setMovement("");
      setReps("");
      setWeight("");
      setNotes("");
      setShowNotes(false);
      setIsSubmitting(false);
      setIsOpen(false);
      setError(null);

      // Trigger success callback for rest timer
      if (onLogSuccess) onLogSuccess();
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

        <div className="space-y-4 p-5 rounded-3xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Exertion (RPE)
            </label>
            <span className={`text-sm font-black italic ${rpe >= 9 ? 'text-red-400' : rpe <= 6 ? 'text-primary' : 'text-white'}`}>
              RPE {rpe}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            disabled={isSubmitting}
          />
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-600 px-1">
            <span>Easy</span>
            <span className="text-primary italic">Perfect</span>
            <span>Failure</span>
          </div>
        </div>

        {/* Expandable Notes */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors ml-1"
          >
            <FileText className="w-3 h-3" /> 
            {showNotes ? "Hide Notes" : "Add Training Notes"}
            {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          {showNotes && (
            <textarea
              placeholder="e.g. Felt light, explosive tempo..."
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all text-sm font-medium text-slate-300 placeholder:text-slate-700 min-h-[80px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          )}
        </div>

        {suggestion && (
          <button
            type="button"
            onClick={applySuggestion}
            className="w-full p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between group hover:bg-primary/20 transition-all animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Elite Suggestion</p>
                <p className="text-sm font-bold text-white leading-none">
                  Target: <span className="text-primary">{suggestion.suggestedWeight}kg</span> x {suggestion.suggestedReps}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter group-hover:text-primary transition-colors">
              Click to Apply
            </span>
          </button>
        )}

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

