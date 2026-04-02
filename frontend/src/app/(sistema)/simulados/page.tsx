"use client";

import { useState, useEffect } from "react";
import { MOCK_SIMULADOS } from "@/lib/kevquestLogic";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { Activity, Book, Globe2, Leaf, Calculator, PenTool, Send } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function SimuladosPage() {
  const [simulados, setSimulados] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("kevquest_simulados");
    if (stored) {
      setSimulados(JSON.parse(stored));
    } else {
      setSimulados(MOCK_SIMULADOS);
      localStorage.setItem("kevquest_simulados", JSON.stringify(MOCK_SIMULADOS));
    }
    setIsLoaded(true);
  }, []);

  const [form, setForm] = useState({
    nomeProva: "",
    linguagens: "",
    humanas: "",
    naturezas: "",
    matematica: "",
    redacao: ""
  });

  const handleSubmit = () => {
    if (!form.nomeProva || !form.linguagens || !form.humanas || !form.naturezas || !form.matematica || !form.redacao) {
      toast.error("Preencha o nome da prova e as notas de todas áreas!");
      return;
    }

    const nLing = parseInt(form.linguagens);
    const nHum = parseInt(form.humanas);
    const nNat = parseInt(form.naturezas);
    const nMat = parseInt(form.matematica);
    const nRed = parseInt(form.redacao);

    if (nLing > 45 || nHum > 45 || nNat > 45 || nMat > 45 || nRed > 1000) {
      toast.error("Número de acertos ultrapassa o limite permitido do ENEM.");
      return;
    }

    const novoSimulado = {
      id: "sim_" + Date.now(),
      dataIso: new Date().toISOString(),
      nomeProva: form.nomeProva,
      linguagens: nLing,
      humanas: nHum,
      naturezas: nNat,
      matematica: nMat,
      redacao: nRed
    };

    const novaLista = [...simulados, novoSimulado];
    setSimulados(novaLista);
    localStorage.setItem("kevquest_simulados", JSON.stringify(novaLista));
    toast.success("Desempenho registrado com sucesso!");
    
    setForm({
      nomeProva: "",
      linguagens: "",
      humanas: "",
      naturezas: "",
      matematica: "",
      redacao: ""
    });
  };

  const getChartData = (domain: string) => {
    return simulados.map((sim, index) => ({
      name: sim.nomeProva,
      pontos: sim[domain],
      data: format(new Date(sim.dataIso), "MMM/yy", { locale: ptBR })
    }));
  };

  if (!isLoaded) return <div className="p-8">Carregando painel de Simulados...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl pb-20">
      <header className="mb-4">
        <h1 className="text-3xl font-black text-slate-800 dark:text-[#FFFFFF] tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Módulo de Simulados
        </h1>
        <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium">Lançamento de Acertos em padrão ENEM para acompanhamento da T.R.I.</p>
      </header>

      {/* --- FORMULÁRIO DE LANÇAMENTO --- */}
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-3xl -mx-10 -my-10 z-0 opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-2 uppercase tracking-wide">Qual foi o Simulado?</label>
              <input 
                type="text" 
                placeholder="Ex: ENEM 2023 - 1° Aplicação"
                value={form.nomeProva}
                onChange={e => setForm({...form, nomeProva: e.target.value})}
                className="w-full border-2 border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] bg-white dark:bg-[#1C1C1E] shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all"
              />
            </div>
            
            <button 
              onClick={handleSubmit}
              className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Enviar Resultado
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* LINGUAGENS */}
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-indigo-400">
              <div className="flex items-center gap-2 mb-3">
                <Book className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Linguagens</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.linguagens} onChange={e => setForm({...form, linguagens: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-indigo-900 dark:text-indigo-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-indigo-200 dark:placeholder-indigo-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-indigo-300 dark:text-indigo-500">/ 45</span>
              </div>
            </div>

            {/* HUMANAS */}
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-amber-400">
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-amber-900 dark:text-amber-300 text-sm">Humanas</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.humanas} onChange={e => setForm({...form, humanas: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-amber-900 dark:text-amber-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-amber-200 dark:placeholder-amber-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-amber-300 dark:text-amber-500">/ 45</span>
              </div>
            </div>

            {/* NATUREZAS */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-emerald-400">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">Naturezas</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.naturezas} onChange={e => setForm({...form, naturezas: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-emerald-900 dark:text-emerald-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-emerald-200 dark:placeholder-emerald-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-emerald-300 dark:text-emerald-500">/ 45</span>
              </div>
            </div>

            {/* MATEMÁTICA */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-blue-400">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-blue-900 dark:text-blue-300 text-sm">Matemática</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="45" value={form.matematica} onChange={e => setForm({...form, matematica: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-blue-900 dark:text-blue-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-blue-200 dark:placeholder-blue-800 focus:outline-none" placeholder="00" />
                <span className="text-xs font-bold text-blue-300 dark:text-blue-500">/ 45</span>
              </div>
            </div>

            {/* REDAÇÃO */}
            <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-rose-400 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="font-bold text-rose-900 dark:text-rose-300 text-sm">Redação</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="1000" step="20" value={form.redacao} onChange={e => setForm({...form, redacao: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-rose-900 dark:text-rose-300 font-black text-2xl px-3 py-2 rounded-lg text-center shadow-sm placeholder-rose-200 dark:placeholder-rose-800 focus:outline-none" placeholder="0" />
                <span className="text-xs font-bold text-rose-300 dark:text-rose-500">/ 1000</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- GRÁFICOS DE EVOLUÇÃO --- */}
      {simulados.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Gráfico LINGUAGENS */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2"><Book className="w-4 h-4 text-indigo-500" /> Evolução em Linguagens</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('linguagens')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico HUMANAS */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-amber-900 font-bold mb-4 flex items-center gap-2"><Globe2 className="w-4 h-4 text-amber-500" /> Evolução em Humanas</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('humanas')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico NATUREZAS */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-emerald-900 font-bold mb-4 flex items-center gap-2"><Leaf className="w-4 h-4 text-emerald-500" /> Evolução em Naturezas</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('naturezas')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico MATEMÁTICA */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
            <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-500" /> Evolução em Matemática</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('matematica')} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Acertos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico REDAÇÃO */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] lg:col-span-2">
            <h3 className="text-rose-900 font-bold mb-4 flex items-center gap-2"><PenTool className="w-4 h-4 text-rose-500" /> Teto de Pontos - Redação</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('redacao')} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="pontos" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={50} name="Pontuação" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>
      )}

    </div>
  );
}
