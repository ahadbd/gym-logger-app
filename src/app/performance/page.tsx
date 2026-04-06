"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Workout, PerformanceMetrics } from "@/types";
import { processVolumeTrends, processMuscleDistribution, getPerformanceMetrics, VolumeData, MuscleData } from "@/lib/analytics";
import VolumeChart from "@/components/VolumeChart";
import MuscleRadar from "@/components/MuscleRadar";
import Link from "next/link";
import { ChevronLeft, BarChart3, Target, Award, Zap, Loader2 } from "lucide-react";

export default function PerformanceHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [muscleData, setMuscleData] = useState<MuscleData[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const q = query(
          collection(db, "workouts"),
          where("userId", "==", user.uid),
          orderBy("date", "desc"),
          limit(50)
        );

        const snapshot = await getDocs(q);
        const workouts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Workout[];

        setVolumeData(processVolumeTrends(workouts, 7));
        setMuscleData(processMuscleDistribution(workouts));
        setMetrics(getPerformanceMetrics(workouts));
        setLoading(false);
      } catch (err) {
        console.error("ANALYTICS_FETCH_ERROR:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto p-6 space-y-10 pb-20">
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
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest italic">Performance Overview</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
            Combat <span className="text-primary italic">Analytics</span>
          </h1>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-3 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
          <Award className="w-4 h-4 text-primary" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Peak 1RM</p>
            <h4 className="text-2xl font-black italic text-white tracking-tighter">{metrics?.peak1RM || 0}kg</h4>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-3 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
          <Target className="w-4 h-4 text-primary" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consistency</p>
            <h4 className="text-2xl font-black italic text-white tracking-tighter">{metrics?.consistency || 0}%</h4>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-[2rem] glass border border-primary/20 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
             <p className="text-[10px] font-black text-primary uppercase tracking-widest">Mean Effort (RPE)</p>
             <h4 className="text-3xl font-black italic text-white tracking-tighter">{metrics?.avgRPE || 0}</h4>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Range</p>
           <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-primary tracking-widest border border-primary/20">
             8.0 - 9.0
           </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <VolumeChart data={volumeData} />
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary fill-current" />
            </div>
            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">
              Balance <span className="text-primary tracking-widest">Heatmap</span>
            </h3>
          </div>
          <MuscleRadar data={muscleData} />
        </div>
      </div>

      {/* Summary Alert */}
      <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-2">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest">System Insights</p>
        <p className="text-sm font-bold text-slate-300 italic leading-relaxed">
          {metrics && metrics.consistency > 80 
            ? "Your training volume is currently peaking. Strategic recovery is advised to maintain progress."
            : "Consistency is below target levels. Prioritize your schedule to regain momentum."}
        </p>
      </div>
    </main>
  );
}
