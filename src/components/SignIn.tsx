"use client";

import { useAuth } from "@/context/AuthContext";
import { Dumbbell, LogIn } from "lucide-react";

export default function SignIn() {
  const { login, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md space-y-12 text-center">
        <div className="space-y-6">
          <div className="inline-flex p-5 bg-primary/10 rounded-[2rem] border border-primary/20 glow">
            <Dumbbell className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter italic uppercase text-white">
              Gym <span className="text-primary">Logger</span>
            </h1>
            <p className="text-slate-400 font-medium tracking-tight text-lg">
              Precision tracking for your elite performance.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={login}
            disabled={loading}
            className="w-full py-5 px-6 rounded-[2rem] bg-white text-slate-950 font-black text-xl tracking-tighter uppercase italic flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
          >
            <LogIn className="w-6 h-6" />
            Sign in with Google
          </button>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            Secure Authentication via Google
          </p>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-4 opacity-50">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent self-center" />
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase">Est. 2024</span>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent self-center" />
        </div>
      </div>
    </div>
  );
}
