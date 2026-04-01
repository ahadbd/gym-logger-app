import { WorkoutEntry as WorkoutEntryType } from "@/types";
import { Dumbbell, Activity, FileText } from "lucide-react";

interface WorkoutEntryProps {
  entry: WorkoutEntryType;
  setNumber?: number;
}

export default function WorkoutEntry({ entry, setNumber }: WorkoutEntryProps) {
  return (
    <div className="group relative flex flex-col p-5 glass rounded-[2rem] border border-white/5 glow animate-slide-up hover:scale-[1.01] transition-all duration-300 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl group-hover:bg-primary/30 transition-colors">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-black text-xl tracking-tighter text-white uppercase italic">{entry.movement}</p>
              {setNumber && (
                <span className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] font-black text-slate-500 tracking-widest border border-white/5">
                  SET #{setNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {entry.reps} <span className="text-[10px] opacity-60">Reps</span>
              </p>
              {entry.rpe && (
                <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-primary uppercase">
                  <Activity className="w-3 h-3" />
                  RPE {entry.rpe}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black tracking-tighter text-white tabular-nums">{entry.weight}</span>
          <span className="text-[10px] font-black ml-1 text-primary tracking-widest uppercase italic">kg</span>
        </div>
      </div>

      {entry.notes && (
        <div className="mt-4 p-4 rounded-2xl bg-black/20 border border-white/5 flex items-start gap-3">
          <FileText className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-slate-400 italic leading-relaxed">
            {entry.notes}
          </p>
        </div>
      )}
    </div>
  );
}

