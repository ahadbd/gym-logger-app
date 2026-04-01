"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import SignIn from "@/components/SignIn";
import UserHeader from "@/components/UserHeader";
import WorkoutList from "@/components/WorkoutList";
import WorkoutForm from "@/components/WorkoutForm";
import TemplateVault from "@/components/TemplateVault";
import RestTimer from "@/components/RestTimer";
import PRAlert from "@/components/PRAlert";
import Link from "next/link";
import { History, Dumbbell, Zap, Loader2, BarChart3, Trophy } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [isResting, setIsResting] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [activePR, setActivePR] = useState<{
    movement: string;
    type: "weight" | "1rm";
    old: number;
    new: number;
  } | null>(null);

  // Persistence: Check for active rest timer on mount
  useEffect(() => {
    const storedEnd = localStorage.getItem("gym_logger_rest_end");
    if (storedEnd) {
      const endTime = parseInt(storedEnd, 10);
      if (endTime > Date.now()) {
        setIsResting(true);
      } else {
        localStorage.removeItem("gym_logger_rest_end");
        localStorage.removeItem("gym_logger_rest_total");
      }
    }
  }, []);

  const startRest = () => {
    // Clear any previous timer data to ensure a fresh 90s start
    localStorage.removeItem("gym_logger_rest_end");
    localStorage.removeItem("gym_logger_rest_total");
    setTimerKey(prev => prev + 1);
    setIsResting(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto flex flex-col relative px-6">
      {/* PR Celebration Overlay */}
      {activePR && (
        <PRAlert
          movement={activePR.movement}
          type={activePR.type}
          oldValue={activePR.old}
          newValue={activePR.new}
          onClose={() => setActivePR(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 py-8 glass -mx-6 px-6 mb-8 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Gym<span className="text-primary">Logger</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              href="/leaderboard" 
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-white"
            >
              <Trophy className="w-6 h-6" />
            </Link>
            <Link 
              href="/performance" 
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-primary glow"
            >
              <BarChart3 className="w-6 h-6" />
            </Link>
            <Link 
              href="/history" 
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-white"
            >
              <History className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 space-y-12">
        <UserHeader />
        
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-xs font-black uppercase tracking-widest italic">Live Session</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight leading-[0.9] text-white italic uppercase">
            Push Your <br />
            <span className="text-primary italic">Limits.</span>
          </h2>
        </header>

        <section className="space-y-16">
          <TemplateVault 
            onLogSuccess={startRest} 
            onPR={(data) => setActivePR(data)}
          />
          
          <div className="pb-32">
            <WorkoutList />
          </div>
        </section>
      </div>


      {/* Interactive Components Area */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto space-y-4">
          {isResting && (
            <RestTimer 
              key={timerKey}
              duration={90} 
              onClose={() => setIsResting(false)} 
            />
          )}
          <WorkoutForm 
            onLogSuccess={startRest} 
            onPR={(data) => setActivePR(data)}
          />
        </div>
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent -z-10 pointer-events-none" />
      </div>
    </main>
  );
}






