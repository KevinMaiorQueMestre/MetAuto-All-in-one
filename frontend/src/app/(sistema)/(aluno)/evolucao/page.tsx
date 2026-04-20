"use client";

import { BarChart2 } from "lucide-react";

export default function EvolucaoPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[2.5rem] shadow-xl shadow-blue-500/10">
        <BarChart2 className="w-16 h-16 text-[#1B2B5E] dark:text-blue-400" />
      </div>
      <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
        Evolução Geral
      </h1>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
        Em desenvolvimento para a v2.0
      </p>
    </div>
  );
}
