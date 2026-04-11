"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Target, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getSummaryCards, type SummaryCards as SummaryData } from "@/lib/db/dashboard";

export default function SummaryCards() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const summary = await getSummaryCards(user.id);
      setData(summary);
      setLoading(false);
    }
    load();
  }, []);

  const cards = data
    ? [
        {
          title: "Questões Lançadas",
          value: data.totalQuestoes.toLocaleString("pt-BR"),
          trend: "Total no KevQuest",
          trendPositive: true,
          icon: <Target className="w-6 h-6 text-white" />,
          iconBg: "bg-emerald-500 shadow-lg shadow-emerald-500/20",
          accentBg: "bg-emerald-500/5",
        },
        {
          title: "Taxa de Acerto Global",
          value: data.taxaAcertoGlobal > 0 ? `${data.taxaAcertoGlobal}%` : "—",
          trend: data.taxaAcertoGlobal > 0 ? "Média dos simulados" : "Faça um simulado",
          trendPositive: data.taxaAcertoGlobal >= 60,
          icon: <CheckCircle2 className="w-6 h-6 text-white" />,
          iconBg: "bg-indigo-600 shadow-lg shadow-indigo-600/20",
          accentBg: "bg-indigo-500/5",
        },
        {
          title: "Horas de Estudo",
          value: data.horasEstudo > 0 ? `${data.horasEstudo}h` : "0h",
          trend: data.horasEstudo > 0 ? "Sessões registradas" : "Inicie uma sessão",
          trendPositive: data.horasEstudo > 0,
          icon: <Clock className="w-6 h-6 text-white" />,
          iconBg: "bg-amber-500 shadow-lg shadow-amber-500/20",
          accentBg: "bg-amber-500/5",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-7 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex items-center justify-center h-40 animate-pulse"
          >
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-7 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col justify-between transition-all hover:shadow-md group relative overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-40 h-40 ${card.accentBg} rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none`} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                {card.title}
              </p>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>{card.icon}</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">
                {card.value}
              </div>
              <div className="flex items-center gap-2">
                {card.trendPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                )}
                <p className={`text-xs font-black uppercase tracking-widest ${card.trendPositive ? "text-emerald-500" : "text-amber-500"}`}>
                  {card.trend}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
