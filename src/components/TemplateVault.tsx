"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, Timestamp, limit, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Template, WorkoutEntrySchema } from "@/types";
import { getSuggestedPerformance, updateLeaderboardEntry } from "@/lib/analytics";
import { Plus, Trash2, Zap, Bookmark, Loader2, X, ArrowUpRight } from "lucide-react";
import { startOfDay, endOfDay } from "date-fns";

interface TemplateVaultProps {
  onLogSuccess: () => void;
  onPR?: (data: { movement: string; type: "weight" | "1rm"; old: number; new: number }) => void;
}

export default function TemplateVault({ onLogSuccess, onPR }: TemplateVaultProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isLogging, setIsLogging] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, any>>({});

  // New Template Form State
  const [newName, setNewName] = useState("");
  const [newMovement, setNewMovement] = useState("");
  const [newReps, setNewReps] = useState<number | "">("");
  const [newWeight, setNewWeight] = useState<number | "">("");

  const calculate1RM = (w: number, r: number) => {
    if (r === 1) return w;
    return Number((w * (1 + r / 30)).toFixed(1));
  };

  const checkPR = async (m: string, w: number, r: number) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "workouts"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        limit(50)
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

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "templates"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Template[];
      setTemplates(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Evolution Mapping: Check if templates are ready for overload
  useEffect(() => {
    if (!user || templates.length === 0) return;

    const fetchAllSuggestions = async () => {
      const newSuggestions: Record<string, any> = {};
      for (const t of templates) {
        if (!newSuggestions[t.movement]) {
          const res = await getSuggestedPerformance(user.uid, t.movement);
          if (res) newSuggestions[t.movement] = res;
        }
      }
      setSuggestions(newSuggestions);
    };

    fetchAllSuggestions();
  }, [templates, user]);

  const handleQuickLog = async (template: Template) => {
    if (!user || isLogging) return;
    setIsLogging(template.id);

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
      const entry = {
        movement: template.movement,
        reps: template.reps,
        weight: template.weight
      };

      if (!snapshot.empty) {
        const workoutDoc = snapshot.docs[0];
        await updateDoc(workoutDoc.ref, {
          entries: arrayUnion(entry),
        });
      } else {
        await addDoc(collection(db, "workouts"), {
          userId: user.uid,
          date: Timestamp.fromDate(today),
          entries: [entry],
          createdAt: Timestamp.now(),
        });
      }

      // Check for PR before success trigger
      await checkPR(template.movement, template.weight, template.reps);

      // Sync with global leaderboard
      updateLeaderboardEntry(user);

      onLogSuccess();
    } catch (error) {
      console.error("QUICK_LOG_ERROR:", error);
    } finally {
      setIsLogging(null);
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const r = Number(newReps);
    const w = Number(newWeight);

    try {
      await addDoc(collection(db, "templates"), {
        userId: user.uid,
        name: newName,
        movement: newMovement,
        reps: r,
        weight: w,
        createdAt: Timestamp.now(),
      });
      setIsAdding(false);
      setNewName("");
      setNewMovement("");
      setNewReps("");
      setNewWeight("");
    } catch (error) {
      console.error("ADD_TEMPLATE_ERROR:", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this template from the vault?")) return;
    try {
      await deleteDoc(doc(db, "templates", id));
    } catch (error) {
      console.error("DELETE_TEMPLATE_ERROR:", error);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Bookmark className="w-4 h-4 fill-current" />
            <span className="text-xs font-black uppercase tracking-widest italic">The Vault</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Workout <span className="text-primary italic font-black">Presets</span></h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-3 rounded-xl bg-white/5 border border-white/10 text-primary hover:bg-white/10 transition-all active:scale-95 glow"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddTemplate} className="glass rounded-3xl p-6 space-y-4 border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
          <input
            type="text"
            placeholder="Template Name (e.g. Heavy Squat)"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-primary/50"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Movement"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-primary/50"
            value={newMovement}
            onChange={(e) => setNewMovement(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Reps"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-primary/50"
              value={newReps}
              onChange={(e) => setNewReps(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
            <input
              type="number"
              step="0.5"
              placeholder="Weight (kg)"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-primary/50"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-primary text-white font-black text-xs tracking-widest uppercase italic glow hover:scale-[1.01] active:scale-95 transition-all"
          >
            SAVE TO VAULT
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleQuickLog(template)}
            className="glass group relative p-5 rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all cursor-pointer active:scale-95 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl rounded-full group-hover:bg-primary/20 transition-all" />
            
            <div className="space-y-3 relative z-10">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic leading-none">
                  {template.name}
                </span>
                <div className="flex items-center gap-2">
                  {suggestions[template.movement] && suggestions[template.movement].lastWeight >= template.weight && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/20 border border-primary/30 animate-pulse">
                      <ArrowUpRight className="w-3 h-3 text-primary" />
                      <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Evolution</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleDelete(template.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-red-500/60 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-black tracking-tighter text-white uppercase italic leading-tight truncate">
                  {template.movement}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-white italic">{template.reps}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Reps</span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-white italic">{template.weight}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">KG</span>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                {isLogging === template.id ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">
                    Tap to Quick Log
                  </span>
                )}
                <Zap className={`w-3 h-3 fill-current ${isLogging === template.id ? 'text-primary' : 'text-slate-700'} group-hover:text-primary transition-colors`} />
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && !isAdding && (
          <div 
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-white/5 hover:border-primary/20 hover:bg-white/[0.02] transition-all cursor-pointer group"
          >
            <Bookmark className="w-6 h-6 text-slate-700 group-hover:text-primary/40 transition-colors mb-2" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">
              Vault Empty<br/>Add Your First Preset
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
