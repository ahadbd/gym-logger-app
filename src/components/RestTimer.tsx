"use client";

import { useEffect, useState, useRef } from "react";
import { X, Play, RotateCcw, Plus } from "lucide-react";

interface RestTimerProps {
  duration: number;
  onClose: () => void;
}

export default function RestTimer({ duration, onClose }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);
  const [totalDuration, setTotalDuration] = useState(duration);
  
  // Use a ref for the end time to avoid re-renders if we add time
  const endTimeRef = useRef<number>(0);

  useEffect(() => {
    // 1. Initialize from localStorage or props
    const storedEnd = localStorage.getItem("gym_logger_rest_end");
    const storedTotal = localStorage.getItem("gym_logger_rest_total");

    if (storedEnd && storedTotal) {
      const end = parseInt(storedEnd, 10);
      const total = parseInt(storedTotal, 10);
      
      if (end > Date.now()) {
        endTimeRef.current = end;
        setTotalDuration(total);
        setTimeLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
      } else {
        // Expired, start fresh
        const newEnd = Date.now() + duration * 1000;
        endTimeRef.current = newEnd;
        setTotalDuration(duration);
        setTimeLeft(duration);
        localStorage.setItem("gym_logger_rest_end", newEnd.toString());
        localStorage.setItem("gym_logger_rest_total", duration.toString());
      }
    } else {
      // First time, start fresh
      const newEnd = Date.now() + duration * 1000;
      endTimeRef.current = newEnd;
      setTotalDuration(duration);
      setTimeLeft(duration);
      localStorage.setItem("gym_logger_rest_end", newEnd.toString());
      localStorage.setItem("gym_logger_rest_total", duration.toString());
    }

    // 2. Main ticker
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setIsActive(false);
        localStorage.removeItem("gym_logger_rest_end");
        localStorage.removeItem("gym_logger_rest_total");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration]);

  const addTime = () => {
    const newEnd = endTimeRef.current + 30 * 1000;
    const newTotal = totalDuration + 30;
    
    endTimeRef.current = newEnd;
    setTotalDuration(newTotal);
    setTimeLeft(Math.max(0, Math.round((newEnd - Date.now()) / 1000)));
    
    localStorage.setItem("gym_logger_rest_end", newEnd.toString());
    localStorage.setItem("gym_logger_rest_total", newTotal.toString());
  };

  const handleClose = () => {
    localStorage.removeItem("gym_logger_rest_end");
    localStorage.removeItem("gym_logger_rest_total");
    onClose();
  };

  // Progress calculation
  // We use the current dynamic totalDuration to show correct percentage
  const percentage = (timeLeft / totalDuration) * 100;
  const strokeDashoffset = 283 - (283 * percentage) / 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full glass rounded-[2.5rem] p-8 space-y-6 glow border border-primary/20 relative animate-in fade-in zoom-in duration-300">
      <button 
        onClick={handleClose}
        className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">
          Rest <span className="text-primary">Active</span>
        </h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Recovery Phase</p>
      </div>

      <div className="relative flex items-center justify-center py-6">
        {/* Progress Ring */}
        <svg className="w-48 h-48 -rotate-90 transform">
          <circle
            cx="96"
            cy="96"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/5"
          />
          <circle
            cx="96"
            cy="96"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
          />
        </svg>

        {/* Time Display */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-black italic tracking-tighter text-white transition-all duration-300 ${timeLeft < 10 && timeLeft > 0 ? 'text-red-500 scale-110 animate-pulse' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={addTime}
          className="py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs tracking-widest uppercase hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add 30s
        </button>
        <button
          onClick={handleClose}
          className="py-4 rounded-2xl bg-primary text-white font-black text-xs tracking-widest uppercase italic glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Skip Rest
        </button>
      </div>
    </div>
  );
}
