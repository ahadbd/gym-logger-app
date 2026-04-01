"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";

import Image from "next/image";

export default function UserHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center justify-between p-4 mb-6 bg-slate-900/40 rounded-3xl backdrop-blur-xl border border-slate-800/50">
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <Image 
            src={user.photoURL} 
            alt={user.displayName || "User"} 
            width={40}
            height={40}
            className="w-10 h-10 rounded-full border-2 border-primary/40 p-[2px] glow"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-widest text-primary uppercase">Elite Member</span>
          <span className="text-sm font-bold text-white tracking-tight leading-tight">
            {user.displayName || "Athlete"}
          </span>
        </div>
      </div>
      
      <button
        onClick={logout}
        className="p-2.5 rounded-2xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95 border border-slate-700/50"
        title="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
