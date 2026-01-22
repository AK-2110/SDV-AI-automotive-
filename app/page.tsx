
import Link from 'next/link';
import { ArrowRight, Cpu, Activity, Code2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />

      <nav className="relative z-10 flex justify-between items-center p-8 border-b border-white/10 backdrop-blur-sm">
        <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          SDV.GENAI
        </h1>
        <div className="flex gap-4">
          {/* Navigation Links (optional) */}
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
          <Cpu size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-zinc-300">Next-Gen Automotive Software Platform</span>
        </div>

        <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
          Accelerate your <br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">SDV Development</span>
        </h2>

        <p className="max-w-2xl text-lg text-zinc-400 mb-12">
          Experience the future of Software Defined Vehicles. visualising real-time vehicle telematics
          and generating service-oriented applications using Generative AI.
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          <Link
            href="/dashboard"
            className="group relative px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all font-semibold flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <Activity className="group-hover:scale-110 transition-transform" />
            Launch Dashboard
          </Link>

          <Link
            href="/genai"
            className="group px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-semibold flex items-center gap-3"
          >
            <Code2 className="group-hover:rotate-12 transition-transform" />
            Open GenAI Studio
          </Link>
        </div>
      </div>

      <footer className="relative z-10 p-8 border-t border-white/10 text-center text-zinc-600 text-sm">
        © 2026 SDV GenAI Platform. Built for Advanced Agentic Coding.
      </footer>
    </main>
  );
}
