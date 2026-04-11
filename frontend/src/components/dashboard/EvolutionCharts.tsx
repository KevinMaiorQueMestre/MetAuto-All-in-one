"use client";

import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, Clock, Target, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  getEvolucao7Dias,
  getEvolucao5Semanas,
  getEvolucao3Meses,
  getTempoEDesempenhoPorDisciplina,
  type PeriodoData,
  type DisciplinaData,
} from "@/lib/db/dashboard";

type Periodo = "7dias" | "5semanas" | "3meses";

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "7dias",    label: "7 Dias"    },
  { key: "5semanas", label: "5 Semanas" },
  { key: "3meses",   label: "3 Meses"  },
];

function formatarMinutos(minutos: number): string {
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function PeriodSelector({ value, onChange }: { value: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-[#2C2C2E] p-1 rounded-xl">
      {PERIODOS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            value === p.key
              ? "bg-white dark:bg-[#1C1C1E] text-slate-800 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-[#A1A1AA] hover:text-slate-700 dark:hover:text-white"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function TooltipTempo({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] rounded-2xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-slate-600 dark:text-[#A1A1AA] mb-1">{label}</p>
      <p className="text-sm font-bold text-indigo-500">⏱ {formatarMinutos(payload[0].value)}</p>
    </div>
  );
}

function TooltipAcertos({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const acertos = payload.find((p: any) => p.dataKey === "acertos");
  const erros   = payload.find((p: any) => p.dataKey === "erros");
  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] rounded-2xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-slate-600 dark:text-[#A1A1AA] mb-2">{label}</p>
      {acertos && <p className="text-sm font-bold text-teal-500">✅ Acertos: {acertos.value}%</p>}
      {erros    && <p className="text-sm font-bold text-orange-400">❌ Erros: {erros.value}%</p>}
    </div>
  );
}

function TooltipDisciplina({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const tempo  = payload.find((p: any) => p.dataKey === "minutos");
  const desemp = payload.find((p: any) => p.dataKey === "desempenho");
  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] rounded-2xl px-4 py-3 shadow-xl min-w-[160px]">
      <p className="text-xs font-bold text-slate-600 dark:text-[#A1A1AA] mb-2">{label}</p>
      {tempo  && <p className="text-sm font-bold text-violet-500">⏱ {formatarMinutos(tempo.value)}</p>}
      {desemp && <p className="text-sm font-bold text-amber-500">🎯 {desemp.value}% acerto</p>}
    </div>
  );
}

// ── Gráfico Acertos × Erros ──────────────────────────────────
function GraficoAcertosErros({ data }: { data: PeriodoData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradAcertos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00A896" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00A896" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="gradErros" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#FF9F1C" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FF9F1C" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3" vertical={false} stroke="#E2E8F080" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={8} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<TooltipAcertos />} />
        <Area type="monotone" dataKey="acertos" stroke="#00A896" strokeWidth={3} fillOpacity={1} fill="url(#gradAcertos)" />
        <Area type="monotone" dataKey="erros"   stroke="#FF9F1C" strokeWidth={3} fillOpacity={1} fill="url(#gradErros)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Gráfico Tempo de Estudo ──────────────────────────────────
function GraficoTempo({ data }: { data: PeriodoData[] }) {
  const maxMin = Math.max(...data.map((d) => d.minutos), 1);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTempo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#818CF8" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#6366F1" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3" vertical={false} stroke="#E2E8F080" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dy={8} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={(v) => formatarMinutos(v)} />
        <Tooltip content={<TooltipTempo />} />
        <Bar dataKey="minutos" radius={[8, 8, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.minutos === maxMin ? "#6366F1" : "url(#gradTempo)"}
              opacity={entry.minutos === maxMin ? 1 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Gráfico por Disciplina ───────────────────────────────────
function GraficoDisciplinas({ data }: { data: DisciplinaData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400 text-sm">Nenhuma sessão de estudo registrada ainda.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradDisc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3" vertical={false} stroke="#E2E8F080" />
        <XAxis dataKey="disciplina" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} dy={8} />
        <YAxis yAxisId="tempo"  orientation="left"  axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => formatarMinutos(v)} width={56} />
        <YAxis yAxisId="desemp" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={44} />
        <Tooltip content={<TooltipDisciplina />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} formatter={(value) => value === "minutos" ? "Tempo estudado" : "% Desempenho"} />
        <Bar  yAxisId="tempo"  dataKey="minutos"    name="minutos"    fill="url(#gradDisc)" radius={[8, 8, 0, 0]} maxBarSize={40} />
        <Line yAxisId="desemp" type="monotone" dataKey="desempenho" name="desempenho" stroke="#F59E0B" strokeWidth={3} dot={{ r: 5, fill: "#F59E0B", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Componente Principal ─────────────────────────────────────
export default function EvolutionCharts() {
  const [userId, setUserId] = useState<string | null>(null);
  const [periodoAcertos, setPeriodoAcertos] = useState<Periodo>("5semanas");
  const [periodoTempo,   setPeriodoTempo]   = useState<Periodo>("5semanas");

  // Dados por período para acertos
  const [dataAcertos7,    setDataAcertos7]    = useState<PeriodoData[]>([]);
  const [dataAcertos5sem, setDataAcertos5sem] = useState<PeriodoData[]>([]);
  const [dataAcertos3m,   setDataAcertos3m]   = useState<PeriodoData[]>([]);

  // Dados por período para tempo (mesmos arrays, campo minutos)
  const [dataDisciplinas, setDataDisciplinas] = useState<DisciplinaData[]>([]);

  const [loadingPeriodo,  setLoadingPeriodo]  = useState(true);
  const [loadingDisc,     setLoadingDisc]     = useState(true);

  // Carrega userId
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Carrega todos os períodos de uma vez
  useEffect(() => {
    if (!userId) return;
    setLoadingPeriodo(true);
    Promise.all([
      getEvolucao7Dias(userId),
      getEvolucao5Semanas(userId),
      getEvolucao3Meses(userId),
    ]).then(([d7, d5, d3]) => {
      setDataAcertos7(d7);
      setDataAcertos5sem(d5);
      setDataAcertos3m(d3);
      setLoadingPeriodo(false);
    });
  }, [userId]);

  // Carrega dados por disciplina
  useEffect(() => {
    if (!userId) return;
    setLoadingDisc(true);
    getTempoEDesempenhoPorDisciplina(userId).then((d) => {
      setDataDisciplinas(d);
      setLoadingDisc(false);
    });
  }, [userId]);

  const getDataAcertos = (): PeriodoData[] => {
    if (periodoAcertos === "7dias")    return dataAcertos7;
    if (periodoAcertos === "5semanas") return dataAcertos5sem;
    return dataAcertos3m;
  };

  const getDataTempo = (): PeriodoData[] => {
    if (periodoTempo === "7dias")    return dataAcertos7;
    if (periodoTempo === "5semanas") return dataAcertos5sem;
    return dataAcertos3m;
  };

  const ChartSkeleton = () => (
    <div className="h-full flex items-center justify-center animate-pulse">
      <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── Gráfico 1: Acertos × Erros ── */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-teal-50 dark:bg-teal-500/10">
              <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight">Evolução de Desempenho</h2>
              <p className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-0.5">Comparativo de acertos vs erros por período</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="text-xs text-slate-600 dark:text-[#A1A1AA] font-medium">Acertos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-400" />
                <span className="text-xs text-slate-600 dark:text-[#A1A1AA] font-medium">Erros</span>
              </div>
            </div>
            <PeriodSelector value={periodoAcertos} onChange={setPeriodoAcertos} />
          </div>
        </div>
        <div className="h-[280px]">
          {loadingPeriodo ? <ChartSkeleton /> : <GraficoAcertosErros data={getDataAcertos()} />}
        </div>
      </div>

      {/* ── Gráfico 2: Tempo de Estudo ── */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight">Tempo de Estudo</h2>
              <p className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-0.5">Tempo total contabilizado pelas sessões de estudo</p>
            </div>
          </div>
          <PeriodSelector value={periodoTempo} onChange={setPeriodoTempo} />
        </div>
        <div className="h-[280px]">
          {loadingPeriodo ? <ChartSkeleton /> : <GraficoTempo data={getDataTempo()} />}
        </div>
      </div>

      {/* ── Gráfico 3: Tempo + Desempenho por Disciplina ── */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-violet-50 dark:bg-violet-500/10">
              <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight">Tempo × Desempenho por Disciplina</h2>
              <p className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-0.5">Barras = tempo estudado · Linha = % de acerto nas sessões</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-violet-500" />
              <span className="text-slate-600 dark:text-[#A1A1AA] font-medium">Tempo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-600 dark:text-[#A1A1AA] font-medium">Desempenho</span>
            </div>
          </div>
        </div>
        <div className="h-[300px]">
          {loadingDisc ? <ChartSkeleton /> : <GraficoDisciplinas data={dataDisciplinas} />}
        </div>
      </div>
    </div>
  );
}
