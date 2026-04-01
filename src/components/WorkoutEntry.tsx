import { WorkoutEntry as WorkoutEntryType } from "@/types";
import { Dumbbell } from "lucide-react";

interface WorkoutEntryProps {
  entry: WorkoutEntryType;
}

export default function WorkoutEntry({ entry }: WorkoutEntryProps) {
  return (
    <div className="flex items-center justify-between p-5 glass rounded-2xl glow animate-slide-up hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/20 rounded-xl">
          <Dumbbell className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-bold text-lg tracking-tight text-white">{entry.movement}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {entry.reps} Reps
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-3xl font-black tracking-tighter text-white">{entry.weight}</span>
        <span className="text-xs font-bold ml-1 text-primary tracking-tighter uppercase">kg</span>
      </div>
    </div>
  );
}

