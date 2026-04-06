"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ChevronLeft, Trophy, Medal, Zap, Award, Loader2, User as UserIcon } from "lucide-react";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string | null;
  peak1RM: number;
  totalSessions: number;
  lastActive: unknown;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "leaderboard"),
      orderBy("peak1RM", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
      setEntries(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <main className="min-h-screen max-w-lg mx-auto p-6 space-y-10 pb-20 bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/" 
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest italic text-primary/80">Global Rankings</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
            Member <span className="text-primary italic">Leaderboard</span>
          </h1>
        </div>
      </div>

      {/* Top 3 Podiums */}
      <div className="grid grid-cols-3 gap-3 items-end pt-4">
        {/* Silver (2nd) */}
        {top3[1] && (
          <div className="relative group flex flex-col items-center">
             <div className="absolute -top-4 bg-slate-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full z-10">2ND</div>
             <div className="w-full aspect-square glass rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden mb-2">
                {top3[1].photoURL ? <img src={top3[1].photoURL} className="w-full h-full object-cover" alt={top3[1].displayName} /> : <UserIcon className="w-8 h-8 text-slate-500" />}
             </div>
             <p className="text-[10px] font-black text-white uppercase truncate w-full text-center">{top3[1].displayName.split(' ')[0]}</p>
             <p className="text-sm font-black text-slate-400 italic">{top3[1].peak1RM}kg</p>
          </div>
        )}

        {/* Gold (1st) */}
        {top3[0] && (
          <div className="relative group flex flex-col items-center scale-110 -translate-y-4">
             <div className="absolute -top-6 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full z-10 glow animate-bounce">1ST</div>
             <div className="w-full aspect-square glass rounded-full border-2 border-primary flex items-center justify-center overflow-hidden mb-3 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
                {top3[0].photoURL ? <img src={top3[0].photoURL} className="w-full h-full object-cover" alt={top3[0].displayName} /> : <UserIcon className="w-10 h-10 text-primary" />}
             </div>
             <p className="text-xs font-black text-white uppercase truncate w-full text-center">{top3[0].displayName.split(' ')[0]}</p>
             <p className="text-lg font-black text-primary italic leading-none">{top3[0].peak1RM}kg</p>
          </div>
        )}

        {/* Bronze (3rd) */}
        {top3[2] && (
          <div className="relative group flex flex-col items-center">
             <div className="absolute -top-4 bg-orange-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">3RD</div>
             <div className="w-full aspect-square glass rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden mb-2">
                {top3[2].photoURL ? <img src={top3[2].photoURL} className="w-full h-full object-cover" alt={top3[2].displayName} /> : <UserIcon className="w-8 h-8 text-slate-500" />}
             </div>
             <p className="text-[10px] font-black text-white uppercase truncate w-full text-center">{top3[2].displayName.split(' ')[0]}</p>
             <p className="text-sm font-black text-orange-700 italic">{top3[2].peak1RM}kg</p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {remaining.map((entry, index) => (
          <div 
            key={entry.userId}
            className={`p-5 rounded-3xl glass border transition-all flex items-center justify-between ${entry.userId === user?.uid ? 'border-primary/50 bg-primary/5' : 'border-white/5'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-slate-600 w-4">#{index + 4}</span>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                {entry.photoURL ? <img src={entry.photoURL} className="w-full h-full object-cover" alt={entry.displayName} /> : <UserIcon className="w-5 h-5 text-slate-500" />}
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase truncate max-w-[120px]">{entry.displayName}</p>
                <div className="flex items-center gap-2">
                   <Zap className="w-3 h-3 text-primary fill-current" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.totalSessions} Sessions</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Power Level</p>
              <h4 className="text-xl font-black italic tracking-tighter text-white">{entry.peak1RM}kg</h4>
            </div>
          </div>
        ))}

        {remaining.length === 0 && top3.length === 0 && (
          <div className="p-10 text-center space-y-3 border-2 border-dashed border-white/5 rounded-3xl">
             <Trophy className="w-10 h-10 text-slate-800 mx-auto" />
             <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No entries recorded yet.<br/>Log a session to appear!</p>
          </div>
        )}
      </div>

      {/* User Status Card */}
      {entries.some(e => e.userId === user?.uid) && (
        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Award className="w-8 h-8 text-primary" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Your Position</p>
              <p className="text-sm font-bold text-slate-300 italic">You are ranked <span className="text-white font-black">#{entries.findIndex(e => e.userId === user?.uid) + 1}</span> globally.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
