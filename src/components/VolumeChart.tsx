"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { VolumeData } from "@/lib/analytics";

interface VolumeChartProps {
  data: VolumeData[];
}

export default function VolumeChart({ data }: VolumeChartProps) {
  return (
    <div className="w-full h-64 glass rounded-3xl p-6 border border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
      
      <div className="mb-4">
        <h3 className="text-sm font-black text-white/50 uppercase tracking-widest italic">Volume Velocity</h3>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#0f172a", 
              border: "1px solid rgba(var(--primary-rgb), 0.2)",
              borderRadius: "1rem",
              fontSize: "12px",
              fontWeight: 800,
              color: "#fff"
            }}
            itemStyle={{ color: "var(--primary)" }}
          />
          <Area 
            type="monotone" 
            dataKey="volume" 
            stroke="var(--primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorVolume)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
