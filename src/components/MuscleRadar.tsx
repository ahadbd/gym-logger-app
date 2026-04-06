"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { MuscleData } from "@/lib/analytics";

interface MuscleRadarProps {
  data: MuscleData[];
}

export default function MuscleRadar({ data }: MuscleRadarProps) {
  return (
    <div className="w-full h-[400px] glass rounded-3xl p-8 border border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 blur-3xl rounded-full" />
      
      <div className="mb-4">
        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest italic">Structural Balance</h3>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 900 }}
          />
          <Radar
            name="Sets"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.6}
            animationDuration={2000}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center mt-4">
        Set Distribution Across Major Groups
      </p>
    </div>
  );
}
