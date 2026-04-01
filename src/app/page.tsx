import WorkoutList from "@/components/WorkoutList";
import WorkoutForm from "@/components/WorkoutForm";
import Link from "next/link";
import { History, Dumbbell, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen max-w-lg mx-auto flex flex-col relative px-6">
      {/* Header */}
      <header className="sticky top-0 z-40 py-8 glass -mx-6 px-6 mb-8 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow">
              <Dumbbell className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">
              GYM<span className="text-primary italic">LOGGER</span>
            </h1>
          </div>
          <Link 
            href="/history" 
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-white"
          >
            <History className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 space-y-12">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-xs font-black uppercase tracking-widest italic">Live Session</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight leading-[0.9] text-white">
            PUSH YOUR <br />
            <span className="text-primary">LIMITS.</span>
          </h2>
        </header>

        <section className="pb-32">
          <WorkoutList />
        </section>
      </div>

      {/* Sticky Action Area */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <WorkoutForm />
        </div>
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent -z-10 pointer-events-none" />
      </div>
    </main>
  );
}


