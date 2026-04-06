"use client";

import { useEffect, useState } from "react";
import { Trophy, Zap, X, ChevronRight } from "lucide-react";

interface PRAlertProps {
  movement: string;
  type: "weight" | "1rm";
  oldValue: number;
  newValue: number;
  onClose: () => void;
}

export default function PRAlert({ movement, type, oldValue, newValue, onClose }: PRAlertProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    // Auto-dismiss after 8 seconds? No, let's keep it manual for the "WOW" factor.
  }, []);

  const diff = (newValue - oldValue).toFixed(1);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-700 ${show ? 'backdrop-blur-xl bg-slate-950/80 opaicty-100' : 'backdrop-blur-none bg-slate-950/0 opacity-0 pointer-events-none'}`}>
      
      {/* Animated Background Confetti/Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary rounded-full animate-ping delay-300" />
      </div>

      <div className={`relative max-w-sm w-full glass rounded-[3rem] p-10 border border-primary/40 shadow-[0_0_80px_rgba(var(--primary-rgb),0.3)] transform transition-all duration-700 delay-100 ${show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-20'}`}>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
            <div className="w-24 h-24 bg-gradient-to-tr from-primary to-yellow-400 rounded-3xl flex items-center justify-center rotate-12 shadow-2xl relative z-10">
              <Trophy className="w-12 h-12 text-white -rotate-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
              New <span className="text-primary">Record</span>
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] pl-1">Strength Milestones</p>
          </div>

          <div className="w-full py-4 px-6 bg-white/5 rounded-2xl border border-white/10">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight truncate">
              {movement}
            </h3>
          </div>

          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Previous</p>
              <div className="text-3xl font-black text-slate-400 italic text-left">{oldValue}kg</div>
            </div>
            
            <div className="pt-4 text-primary animate-bounce">
              <ChevronRight className="w-8 h-8" />
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-right">New Best</p>
              <div className="text-4xl font-black text-white italic text-right glow-text">{newValue}kg</div>
            </div>
          </div>

          <div className="w-full flex items-center gap-3 py-3 px-5 bg-primary/10 rounded-2xl border border-primary/20">
            <Zap className="w-5 h-5 text-primary fill-current" />
            <p className="text-sm font-bold text-white uppercase italic tracking-tight">
              You increased your {type === 'weight' ? 'absolute peak' : 'output'} by <span className="text-primary">{diff}kg</span>!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-6 rounded-2xl bg-primary text-white font-black text-lg tracking-widest uppercase italic shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 glow"
          >
            CRUSHED IT!
          </button>
        </div>
      </div>
    </div>
  );
}
