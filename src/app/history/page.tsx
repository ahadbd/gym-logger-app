"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Workout } from "@/types";
import WorkoutEntry from "@/components/WorkoutEntry";
import Link from "next/link";
import { ArrowLeft, Calendar, LayoutGrid } from "lucide-react";
import { format } from "date-fns";

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "workouts"), orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Workout[];
      setWorkouts(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 max-w-lg mx-auto space-y-12 animate-pulse">
        <header className="flex items-center gap-6 py-8">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl" />
          <div className="w-48 h-8 bg-slate-900 rounded-xl" />
        </header>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-6">
            <div className="w-32 h-6 bg-slate-900 rounded-lg" />
            <div className="h-24 bg-slate-900 rounded-3xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-32 max-w-lg mx-auto px-6">
      <header className="sticky top-0 z-40 py-8 glass -mx-6 px-6 mb-12 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Link href="/" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">HISTORY</h1>
            <p className="text-xs font-bold text-primary uppercase tracking-widest pl-1">Your Legacy</p>
          </div>
        </div>
      </header>

      <div className="space-y-16">
        {workouts.length === 0 ? (
          <div className="text-center py-32 px-4 flex flex-col items-center glass rounded-[2.5rem] glow">
            <div className="p-6 bg-primary/10 rounded-3xl mb-6">
              <LayoutGrid className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-white mb-2">EMPTY VAULT</h2>
            <p className="text-muted-foreground font-medium mb-8">No workouts logged in your history yet.</p>
            <Link href="/" className="px-8 py-4 bg-primary text-white font-black rounded-2xl italic tracking-widest uppercase glow hover:scale-105 transition-all">
              START NOW
            </Link>
          </div>
        ) : (
          workouts.map((workout) => (
            <section key={workout.id} className="space-y-6">
              <header className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3 text-primary">
                  <Calendar className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">
                    {format(workout.date.toDate(), "MMM do, yyyy")}
                  </h3>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-muted-foreground tracking-widest uppercase border border-white/5">
                  {workout.entries.length} Sets
                </div>
              </header>
              
              <div className="flex flex-col gap-4">
                {workout.entries.map((entry, idx) => (
                  <WorkoutEntry key={idx} entry={entry} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}

