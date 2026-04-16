
"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Book, Globe2, Leaf, Calculator, PenTool, Send, Clock, Play, Pause, X, PieChart, Maximize2, Minimize2, Trash2, Loader2, ChevronDown, Pencil, Filter } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getPreferences, updatePreferences } from "@/lib/db/preferences";
import {
  listarSimulados,
  criarSimulado,
  atualizarSimulado,
  deletarSimulado,
  type SimuladoDB
} from "@/lib/db/simulados";
import { MODELOS_PROVAS, type ModeloProva, type FaseProva, type CampoProva } from "@/lib/config/provas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Line,
  Legend
} from "recharts";

// --- CUSTOM TOOLTIPS FOR GRAPHS ---
function TooltipGeral({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold text-indigo-400">
          📊 {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function TooltipD1({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ling = payload.find((p: any) => p.dataKey === "linguagens");
  const hum = payload.find((p: any) => p.dataKey === "humanas");
  const temp = payload.find((p: any) => p.dataKey === "tempo1");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {ling && <p className="text-sm font-bold text-indigo-400">📚 Linguagens: {ling.value}</p>}
      {hum && <p className="text-sm font-bold text-amber-500">🌍 Humanas: {hum.value}</p>}
      {temp && <p className="text-sm font-bold text-slate-400 border-t border-white/5 mt-2 pt-2">⏱ Tempo: {temp.value} min</p>}
    </div>
  );
}

function TooltipRedacao({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const nota = payload.find((p: any) => p.dataKey === "nota");
  const tempo = payload.find((p: any) => p.dataKey === "tempo");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {nota && <p className="text-lg font-black text-rose-500">✍️ Nota: {nota.value}</p>}
      {tempo && <p className="text-sm font-bold text-slate-400 mt-1">⏱ Tempo: {tempo.value} min</p>}
    </div>
  );
}

function TooltipD2({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const mat = payload.find((p: any) => p.dataKey === "matematica");
  const nat = payload.find((p: any) => p.dataKey === "naturezas");
  const temp = payload.find((p: any) => p.dataKey === "tempo2");
  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md min-w-[180px]">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      {mat && <p className="text-sm font-bold text-blue-400">🧮 Matemática: {mat.value}</p>}
      {nat && <p className="text-sm font-bold text-emerald-400">🧪 Naturezas: {nat.value}</p>}
      {temp && <p className="text-sm font-bold text-slate-400 border-t border-white/5 mt-2 pt-2">⏱ Tempo: {temp.value} min</p>}
    </div>
  );
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  dropdownClasses = "",
  onAddNewItem
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  dropdownClasses?: string;
  onAddNewItem?: (val: string) => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  const handleAddNew = async () => {
    if (!newVal.trim() || !onAddNewItem) return;
    await onAddNewItem(newVal.trim());
    setNewVal("");
    setIsAdding(false);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex justify-between items-center outline-none transition-all ${className} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer hover:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'}`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : <span className="opacity-50 font-medium">{placeholder}</span>}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute z-[100] w-full mt-2 bg-white dark:bg-[#1C1C1EE6] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${dropdownClasses}`}
          >
            <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar">
              {onAddNewItem && (
                isAdding ? (
                  <div className="flex gap-2 p-1 border border-indigo-200 dark:border-indigo-500/30 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 mb-1">
                    <input
                      autoFocus
                      value={newVal}
                      onChange={e => setNewVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                      }}
                      placeholder="Digite e aperte Enter..."
                      className="flex-1 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-2 text-sm outline-none w-full shadow-inner"
                    />
                    <button onClick={handleAddNew} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">OK</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                    className="w-full text-left px-3 py-2.5 text-indigo-600 dark:text-indigo-400 font-black text-sm bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl flex items-center gap-2 mb-1 border border-indigo-100 dark:border-transparent transition-all shadow-sm"
                  >
                    <span className="text-lg leading-none">+</span> Adicionar Outro
                  </button>
                )
              )}
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${value === opt.value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SimuladoFormFields({ form, setForm, modelo }: { form: any; setForm: any; modelo: ModeloProva }) {
  if (modelo.id === 'ENEM') {
    const renderNum = (id: string, label: string, max: number, cor: string) => (
      <div key={id} className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm relative overflow-hidden group transition-all">
        <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${cor}`}>{label}</label>
        <div className="relative flex items-end gap-3 mt-3">
          <input
            type="number" min="0" max={max}
            value={form[id] || ''}
            onChange={e => setForm({ ...form, [id]: e.target.value })}
            className="w-full bg-white dark:bg-[#1C1C1E] font-black text-4xl px-3 py-3 rounded-2xl shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 text-center border border-transparent transition-all"
          />
          <span className="text-[10px] font-black opacity-40 absolute bottom-4 right-4">/{max}</span>
        </div>
      </div>
    );

    const renderTempo = (hKey: string, mKey: string, label: string) => (
      <div key={hKey} className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.25em]">{label}</label>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
            <input type="number" min="0" placeholder="0" value={form[hKey] || ''} onChange={e => setForm({ ...form, [hKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
            <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
          </div>
          <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
          <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
            <input type="number" min="0" max="59" placeholder="00" value={form[mKey] || ''} onChange={e => setForm({ ...form, [mKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
            <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Linha 1 */}
        <div className="flex flex-wrap gap-4 md:gap-6 w-full">
          {renderNum("linguagens", "Linguagens", 45, "text-indigo-500")}
          {renderNum("humanas", "Humanas", 45, "text-amber-500")}
          {renderTempo("tempo1H", "tempo1M", "Tempo 1º Dia")}
        </div>

        {/* Linha 2 */}
        <div className="flex flex-wrap gap-4 md:gap-6 w-full">
          <div className="flex-1 min-w-[220px] bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group">
            <div>
               <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Módulo Redação</label>
               <p className="text-[8px] text-rose-400 font-black tracking-widest mt-0.5">NOTA FINAL (MAX 1000)</p>
            </div>
            <input
              type="number" step="20" min="0" max="1000"
              value={form.redacao || ''}
              onChange={e => setForm({ ...form, redacao: e.target.value })}
              className="w-full bg-white dark:bg-[#1C1C1E] text-rose-600 dark:text-rose-400 font-black text-4xl px-4 py-4 rounded-2xl shadow-inner mt-4 focus:outline-none text-center"
              placeholder="0"
            />
          </div>

          <div className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-rose-400" />
              <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Tempo Redação</label>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                <input type="number" min="0" placeholder="0" value={form.tempoRedH || ''} onChange={e => setForm({ ...form, tempoRedH: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
              </div>
              <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
              <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                <input type="number" min="0" max="59" placeholder="00" value={form.tempoRedM || ''} onChange={e => setForm({ ...form, tempoRedM: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Linha 3 */}
        <div className="flex flex-wrap gap-4 md:gap-6 w-full">
          {renderNum("naturezas", "Naturezas", 45, "text-emerald-500")}
          {renderNum("matematica", "Matemática", 45, "text-blue-500")}
          {renderTempo("tempo2H", "tempo2M", "Tempo 2º Dia")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {modelo.fases.map((fase, i) => (
        <div key={i} className="space-y-6 relative">
          {modelo.fases.length > 1 && (
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{fase.nome}</h4>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
             </div>
          )}

          <div className="flex flex-wrap gap-4 md:gap-6">
            {fase.campos.map(campo => {
              if (campo.tipo === 'numerico') {
                return (
                  <div key={campo.id} className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm relative overflow-hidden group transition-all">
                    <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${campo.cor}`}>{campo.label}</label>
                    <div className="relative flex items-end gap-3 mt-3">
                      <input
                        type="number" min="0" max={campo.max}
                        value={form[campo.id] || ''}
                        onChange={e => setForm({ ...form, [campo.id]: e.target.value })}
                        className="w-full bg-white dark:bg-[#1C1C1E] font-black text-4xl px-3 py-3 rounded-2xl shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 text-center border border-transparent transition-all"
                      />
                      <span className="text-[10px] font-black opacity-40 absolute bottom-4 right-4">/{campo.max}</span>
                    </div>
                  </div>
                );
              }
              if (campo.tipo === 'certo_errado') {
                return (
                  <div key={campo.id} className="flex-[2] min-w-[320px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 shadow-sm relative overflow-hidden transition-all">
                    <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${campo.cor}`}>{campo.label} (Max ${campo.max})</label>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Certo</span>
                        <input type="number" placeholder="0" value={form[`${campo.id}_c`] || ''} onChange={e => setForm({ ...form, [`${campo.id}_c`]: e.target.value })} className="w-full bg-transparent font-black text-3xl text-center outline-none text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Errado</span>
                        <input type="number" placeholder="0" value={form[`${campo.id}_e`] || ''} onChange={e => setForm({ ...form, [`${campo.id}_e`]: e.target.value })} className="w-full bg-transparent font-black text-3xl text-center outline-none text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Branco</span>
                        <input type="number" placeholder="0" value={form[`${campo.id}_b`] || ''} onChange={e => setForm({ ...form, [`${campo.id}_b`]: e.target.value })} className="w-full bg-transparent font-black text-3xl text-center outline-none text-slate-500" />
                      </div>
                    </div>
                  </div>
                );
              }
              if (campo.tipo === 'informativo') {
                return (
                  <div key={campo.id} className="flex-[2] min-w-[320px] bg-indigo-50/50 dark:bg-[#2C2C2E]/50 border border-indigo-100/50 dark:border-white/5 rounded-[2rem] p-6 shadow-sm relative overflow-hidden transition-all flex flex-col justify-center items-start">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                       <label className={`font-black uppercase tracking-[0.25em] text-[10px] ${campo.cor}`}>{campo.label}</label>
                    </div>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{campo.detalhes}</p>
                  </div>
                );
              }
              return null;
            })}

            {fase.temRedacao && (
              <div className="flex-1 min-w-[220px] bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group">
                <div>
                   <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Módulo Redação</label>
                   <p className="text-[8px] text-rose-400 font-black tracking-widest mt-0.5">NOTA FINAL (MAX 1000)</p>
                </div>
                <input
                  type="number" step="20" min="0" max="1000"
                  value={form.redacao || ''}
                  onChange={e => setForm({ ...form, redacao: e.target.value })}
                  className="w-full bg-white dark:bg-[#1C1C1E] text-rose-600 dark:text-rose-400 font-black text-4xl px-4 py-4 rounded-2xl shadow-inner mt-4 focus:outline-none text-center"
                  placeholder="0"
                />
              </div>
            )}
            
            {fase.dias > 0 && Array.from({ length: fase.dias }).map((_, d) => {
              const hKey = `tempo${fase.dias > 1 ? d + 1 : 1}H`;
              const mKey = `tempo${fase.dias > 1 ? d + 1 : 1}M`;
              return (
                <div key={d} className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.25em]">
                      {fase.dias > 1 ? `Tempo ${d + 1}º Dia` : 'Tempo da Prova'}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" placeholder="0" value={form[hKey] || ''} onChange={e => setForm({ ...form, [hKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
                    </div>
                    <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" max="59" placeholder="00" value={form[mKey] || ''} onChange={e => setForm({ ...form, [mKey]: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {fase.temRedacao && (
               <div className="flex-1 min-w-[220px] bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Tempo Redação</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" placeholder="0" value={form.tempoRedH || ''} onChange={e => setForm({ ...form, tempoRedH: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Horas</p>
                    </div>
                    <span className="text-xl font-black text-slate-300 dark:text-slate-700">:</span>
                    <div className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-xl p-2 border border-slate-100 dark:border-white/5">
                      <input type="number" min="0" max="59" placeholder="00" value={form.tempoRedM || ''} onChange={e => setForm({ ...form, tempoRedM: e.target.value })} className="w-full bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none" />
                      <p className="text-[8px] text-slate-400 text-center uppercase font-bold tracking-widest">Mins</p>
                    </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EditSimuladoModal({
  sim,
  cfgProvas,
  cfgAnos,
  onClose,
  onSave,
}: {
  sim: SimuladoDB;
  cfgProvas: string[];
  cfgAnos: string[];
  onClose: () => void;
  onSave: (updated: SimuladoDB) => void;
}) {
  const partes = sim.titulo_simulado.split(' ');
  const ultimaParte = partes[partes.length - 1];
  const temAno = cfgAnos.includes(ultimaParte) || /^\d{4}$/.test(ultimaParte);
  const nomeInicial = temAno ? partes.slice(0, -1).join(' ') : sim.titulo_simulado;
  const anoInicial = temAno ? ultimaParte : '';

  const modeloInicial = sim.modelo_prova || 'ENEM';

  const initialForm: any = {
     nomeProva: nomeInicial,
     anoProva: anoInicial,
     modeloProva: modeloInicial,
     tempo1H: String(Math.floor((sim.tempo1_min || 0) / 60)),
     tempo1M: String((sim.tempo1_min || 0) % 60),
     tempo2H: String(Math.floor((sim.tempo2_min || 0) / 60)),
     tempo2M: String((sim.tempo2_min || 0) % 60),
     tempoRedH: String(Math.floor((sim.tempo_red_min || 0) / 60)),
     tempoRedM: String((sim.tempo_red_min || 0) % 60),
     redacao: sim.redacao ? String(sim.redacao) : '',
  };

  if (sim.dados_modelo) {
     Object.keys(sim.dados_modelo).forEach(k => {
         const val = sim.dados_modelo[k];
         if (typeof val === 'object' && val !== null) {
            initialForm[`${k}_c`] = val.certos;
            initialForm[`${k}_e`] = val.errados;
            initialForm[`${k}_b`] = val.branco;
         } else {
            initialForm[k] = val ? String(val) : '';
         }
     });
  } else {
     initialForm.linguagens = sim.linguagens > 0 ? String(sim.linguagens) : '';
     initialForm.humanas = sim.humanas > 0 ? String(sim.humanas) : '';
     initialForm.naturezas = sim.naturezas > 0 ? String(sim.naturezas) : '';
     initialForm.matematica = sim.matematica > 0 ? String(sim.matematica) : '';
  }

  const [editForm, setEditForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const modeloSelecionado = MODELOS_PROVAS.find(m => m.id === editForm.modeloProva) || MODELOS_PROVAS[0];

  const handleSave = async () => {
    if (!editForm.nomeProva) { toast.error('Preencha o nome da prova!'); return; }
    
    let acertos = 0;
    let totalQuestoes = 0;
    let nLing = 0, nHum = 0, nNat = 0, nMat = 0, nRed = parseInt(editForm.redacao) || 0;
    const novosDados: any = {};

    modeloSelecionado.fases.forEach(f => {
       f.campos.forEach(c => {
          if (c.tipo === 'numerico') {
             const v = parseInt(editForm[c.id]) || 0;
             novosDados[c.id] = v;
             acertos += v;
             totalQuestoes += c.max;
             if (editForm.modeloProva === 'ENEM') {
                 if (c.id === 'linguagens') nLing = v;
                 if (c.id === 'humanas') nHum = v;
                 if (c.id === 'naturezas') nNat = v;
                 if (c.id === 'matematica') nMat = v;
             }
          } else if (c.tipo === 'certo_errado') {
             const certos = parseInt(editForm[`${c.id}_c`]) || 0;
             const errados = parseInt(editForm[`${c.id}_e`]) || 0;
             const branco = parseInt(editForm[`${c.id}_b`]) || 0;
             novosDados[c.id] = { certos, errados, branco };
             totalQuestoes += c.max;
             acertos += Math.max(0, certos - errados);
          }
       });
    });

    const t1 = (parseInt(editForm.tempo1H) || 0) * 60 + (parseInt(editForm.tempo1M) || 0);
    const t2 = (parseInt(editForm.tempo2H) || 0) * 60 + (parseInt(editForm.tempo2M) || 0);
    const tRed = (parseInt(editForm.tempoRedH) || 0) * 60 + (parseInt(editForm.tempoRedM) || 0);
    const tituloCompleto = editForm.anoProva ? `${editForm.nomeProva} ${editForm.anoProva}` : editForm.nomeProva;
    
    setIsSaving(true);
    try {
      const updated = await atualizarSimulado({
        id: sim.id,
        tituloSimulado: tituloCompleto,
        modeloProva: editForm.modeloProva,
        dadosModelo: novosDados,
        totalQuestoes,
        acertos,
        linguagens: nLing, humanas: nHum, naturezas: nNat, matematica: nMat, redacao: nRed,
        tempo1Min: t1, tempo2Min: t2, tempoRedMin: tRed,
      });
      if (updated) {
        onSave(updated);
        toast.success('Simulado atualizado com sucesso! ✏️');
        onClose();
      } else {
        toast.error('Erro ao atualizar.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-[#2C2C2E] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
      >
        <div className="p-5 md:p-8 flex-1 overflow-y-auto custom-scrollbar w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Pencil className="w-6 h-6 text-indigo-500" />
              Editar Simulado
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Atualize os dados do seu desempenho</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/3">
             <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Modelo da Prova</label>
             <CustomDropdown
                value={editForm.modeloProva}
                onChange={v => setEditForm({ ...editForm, modeloProva: v })}
                options={MODELOS_PROVAS.map(m => ({ value: m.id, label: m.nome }))}
                placeholder="Modelo..."
                className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
              />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Nome da Prova</label>
            {cfgProvas.length > 0 ? (
              <CustomDropdown
                value={editForm.nomeProva}
                onChange={v => setEditForm({ ...editForm, nomeProva: v })}
                options={cfgProvas.map(p => ({ value: p, label: p }))}
                placeholder="Curso / Prova..."
                className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
              />
            ) : (
              <input type="text" value={editForm.nomeProva} onChange={e => setEditForm({ ...editForm, nomeProva: e.target.value })}
                className="w-full h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white outline-none"
              />
            )}
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Ano</label>
            {cfgAnos.length > 0 ? (
              <CustomDropdown
                value={editForm.anoProva}
                onChange={v => setEditForm({ ...editForm, anoProva: v })}
                options={cfgAnos.map(a => ({ value: a, label: a }))}
                placeholder="Ano..."
                className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white"
              />
            ) : (
              <input type="text" value={editForm.anoProva} onChange={e => setEditForm({ ...editForm, anoProva: e.target.value })}
                className="w-full h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-white outline-none"
              />
            )}
          </div>
        </div>

        <SimuladoFormFields form={editForm} setForm={setEditForm} modelo={modeloSelecionado} />

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 h-12 bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-400 font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            {isSaving ? 'Salvando...' : 'Salvar Edição'}
          </button>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SimuladosPage() {
  const [simulados, setSimulados] = useState<SimuladoDB[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingSimulado, setEditingSimulado] = useState<SimuladoDB | null>(null);
  const [activeTab, setActiveTab] = useState<"lancamento" | "metricas">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('simulados_activeTab');
      if (saved === 'metricas') return 'metricas';
    }
    return 'lancamento';
  });

  const [cfgProvas, setCfgProvas] = useState<string[]>([]);
  const [cfgAnos, setCfgAnos] = useState<string[]>([]);

  // ONE GLOBAL MODEL FOR EVERYTHING
  const [globalModeloProva, setGlobalModeloProva] = useState("ENEM");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const prefs = await getPreferences();
      setCfgProvas(prefs.provas || []);
      setCfgAnos(prefs.anos || []);

      const data = await listarSimulados(user.id);
      setSimulados(data);
      setIsLoaded(true);
    }
    init();
  }, []);

  const [form, setForm] = useState<any>({
    nomeProva: "",
    anoProva: "",
    tempo1H: "", tempo1M: "",
    tempo2H: "", tempo2M: "",
    tempoRedH: "", tempoRedM: ""
  });

  // When global model changes, reset form
  useEffect(() => {
    setForm((prev: any) => ({
       nomeProva: prev.nomeProva,
       anoProva: prev.anoProva,
       tempo1H: "", tempo1M: "", tempo2H: "", tempo2M: "", tempoRedH: "", tempoRedM: ""
    }));
  }, [globalModeloProva]);

  const modeloSelecionado = MODELOS_PROVAS.find(m => m.id === globalModeloProva) || MODELOS_PROVAS[0];

  const [timerConfig, setTimerConfig] = useState({ hours: 5, minutes: 30 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showExactTime, setShowExactTime] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      toast.success("Tempo esgotado!");
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const startTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(timerConfig.hours * 3600 + timerConfig.minutes * 60);
    }
    setIsTimerRunning(true);
  };
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    const totalSeconds = timeLeft > 0 ? timeLeft : (timerConfig.hours * 3600 + timerConfig.minutes * 60);
    if (showExactTime || timeLeft === 0 || !isTimerRunning) {
      return formatTime(totalSeconds);
    }
    const blocks30 = Math.ceil(totalSeconds / 1800) * 1800; 
    return formatTime(blocks30);
  };

  const handleSubmit = async () => {
    if (!form.nomeProva) { toast.error("Preencha a identificação (Nome) da prova!"); return; }
    if (!userId) { toast.error("Sessão expirada. Faça login novamente."); return; }

    let acertos = 0;
    let totalQuestoes = 0;
    let nLing = 0, nHum = 0, nNat = 0, nMat = 0, nRed = parseInt(form.redacao) || 0;
    const novosDados: any = {};

    modeloSelecionado.fases.forEach(f => {
       f.campos.forEach(c => {
          if (c.tipo === 'numerico') {
             const v = parseInt(form[c.id]) || 0;
             novosDados[c.id] = v;
             acertos += v;
             totalQuestoes += c.max;
             if (globalModeloProva === 'ENEM') {
                 if (c.id === 'linguagens') nLing = v;
                 if (c.id === 'humanas') nHum = v;
                 if (c.id === 'naturezas') nNat = v;
                 if (c.id === 'matematica') nMat = v;
             }
          } else if (c.tipo === 'certo_errado') {
             const certos = parseInt(form[`${c.id}_c`]) || 0;
             const errados = parseInt(form[`${c.id}_e`]) || 0;
             const branco = parseInt(form[`${c.id}_b`]) || 0;
             novosDados[c.id] = { certos, errados, branco };
             totalQuestoes += c.max;
             acertos += Math.max(0, certos - errados);
          }
       });
    });

    const t1 = (parseInt(form.tempo1H) || 0) * 60 + (parseInt(form.tempo1M) || 0);
    const t2 = (parseInt(form.tempo2H) || 0) * 60 + (parseInt(form.tempo2M) || 0);
    const tRed = (parseInt(form.tempoRedH) || 0) * 60 + (parseInt(form.tempoRedM) || 0);

    setIsSaving(true);
    try {
      const tituloCompleto = form.anoProva ? `${form.nomeProva} ${form.anoProva}` : form.nomeProva;
      const entry = await criarSimulado({
        userId,
        tituloSimulado: tituloCompleto,
        modeloProva: globalModeloProva,
        dadosModelo: novosDados,
        totalQuestoes,
        acertos,
        linguagens: nLing, humanas: nHum, naturezas: nNat, matematica: nMat, redacao: nRed,
        tempo1Min: t1, tempo2Min: t2, tempoRedMin: tRed,
      });
      if (entry) {
        setSimulados(prev => [entry, ...prev]);
        toast.success("Desempenho salvo no banco! 🎯");
        // triggers re-render and cleans form via useEffect but let's force a clean manually preserving name
        setForm({
           nomeProva: form.nomeProva,
           anoProva: form.anoProva,
           tempo1H: "", tempo1M: "", tempo2H: "", tempo2M: "", tempoRedH: "", tempoRedM: ""
        });
      } else {
        toast.error("Erro ao salvar.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deletarSimulado(id);
    if (ok) {
      setSimulados(prev => prev.filter(s => s.id !== id));
      toast.success("Simulado removido.");
    } else {
      toast.error("Erro ao remover.");
    }
  };

  const simuladosFiltrados = simulados.filter(s => (s.modelo_prova || 'ENEM') === globalModeloProva);

  const getGeneralAnalysisData = () => {
    return [...simuladosFiltrados].reverse().map(sim => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name: sim.titulo_simulado,
        display: `${sim.titulo_simulado} (${dateStr})`,
        acertos: sim.acertos,
        maxQ: sim.total_questoes,
      };
    });
  };

  const getChartDataDay1 = () => {
    return [...simuladosFiltrados].reverse().map((sim) => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name: `${sim.titulo_simulado} (${dateStr})`,
        linguagens: sim.linguagens || 0,
        humanas: sim.humanas || 0,
        tempo1: sim.tempo1_min || 0,
      };
    });
  };

  const getChartDataDay2 = () => {
    return [...simuladosFiltrados].reverse().map((sim) => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name: `${sim.titulo_simulado} (${dateStr})`,
        matematica: sim.matematica || 0,
        naturezas: sim.naturezas || 0,
        tempo2: sim.tempo2_min || 0,
      };
    });
  };

  const getRedacaoPerformanceData = () => {
    return [...simuladosFiltrados].reverse().map(sim => {
      const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
      return {
        name: `${sim.titulo_simulado} (${dateStr})`,
        nota: sim.redacao || 0,
        tempo: sim.tempo_red_min || 0,
      };
    });
  };

  const getUNBAnalysisData = () => {
    return [...simuladosFiltrados].reverse().map(sim => {
       const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM", { locale: ptBR }) : "";
       let certos = 0, errados = 0;
       if (sim.dados_modelo) {
          Object.values(sim.dados_modelo).forEach((v: any) => {
             if (v?.certos !== undefined) certos += v.certos;
             if (v?.errados !== undefined) errados += v.errados;
          });
       }
       return {
         name: `${sim.titulo_simulado} (${dateStr})`,
         Liquido: sim.acertos, 
         Certo: certos,
         Errado: errados
       };
    });
  }

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Carregando Simulados...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl pb-20 px-4 md:px-0">
      
      {/* ─── HEAD & GLOBAL SELECTOR ───────────────────────────────────────── */}
      <header className="mb-2 relative z-50">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3 md:gap-4">
              <div className="bg-indigo-600 p-2.5 md:p-3 rounded-[1rem] md:rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              Simulados
            </h1>
            <div className="flex items-center gap-3 mt-2 md:mt-3">
              <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
              <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em]">Alta Performance & Múltiplas Bancas</p>
            </div>
          </div>

          <div className="w-full md:w-64 bg-white dark:bg-[#1C1C1E]/80 backdrop-blur-md p-2 rounded-[1.5rem] border border-slate-200 dark:border-white/10 shadow-sm flex items-center">
            <CustomDropdown
              value={globalModeloProva}
              onChange={setGlobalModeloProva}
              options={MODELOS_PROVAS.map(m => ({ value: m.id, label: m.nome }))}
              placeholder="Banca..."
              className="h-12 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-indigo-500/20 hover:border-indigo-500/40 rounded-[1.2rem] px-5 text-sm font-black text-indigo-600 dark:text-indigo-400"
            />
          </div>

        </div>
      </header>

      {/* ─── TOGGLE LANÇAMENTO / MÉTRICAS ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-2 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex relative z-10">
        <button onClick={() => { setActiveTab("lancamento"); localStorage.setItem('simulados_activeTab', 'lancamento'); }} className={`flex-1 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.18em] transition-all duration-200 ${activeTab === "lancamento" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Lançamento
        </button>
        <button onClick={() => { setActiveTab("metricas"); localStorage.setItem('simulados_activeTab', 'metricas'); }} className={`flex-1 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-[0.18em] transition-all duration-200 ${activeTab === "metricas" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"}`}>
          Evolução ({globalModeloProva})
        </button>
      </div>

      {activeTab === "lancamento" && (
        <>
          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-4 md:gap-6 mb-4 md:mb-6">
              <div className={`relative w-14 h-14 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] flex-shrink-0 flex items-center justify-center border-2 transition-all duration-500 shadow-lg ${isTimerRunning ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <Clock className={`w-6 h-6 md:w-8 md:h-8 transition-colors duration-500 ${isTimerRunning ? 'text-indigo-400' : 'text-slate-500'}`} />
                {isTimerRunning && <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-xl -z-10" />}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-tight mb-0.5">Cronômetro de Simulado</h2>
                <div className="flex items-baseline gap-1.5">
                  <div className={`text-4xl md:text-7xl font-black font-mono tracking-tighter transition-all duration-500 ${isTimerRunning ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>{getDisplayTime().split(':')[0]}:{getDisplayTime().split(':')[1]}</div>
                  <div className={`text-xl md:text-3xl font-black font-mono ${isTimerRunning ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'}`}>:{getDisplayTime().split(':')[2]}</div>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner">
              {!isTimerRunning && timeLeft === 0 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 items-center bg-white dark:bg-slate-700/50 px-6 py-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                  <div className="flex flex-col items-center">
                    <input type="number" min="0" value={timerConfig.hours} onChange={e => setTimerConfig({ ...timerConfig, hours: parseInt(e.target.value) || 0 })} className="w-12 bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none focus:text-indigo-500" />
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Horas</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600 font-black text-2xl pb-6">:</span>
                  <div className="flex flex-col items-center">
                    <input type="number" min="0" max="59" value={timerConfig.minutes} onChange={e => setTimerConfig({ ...timerConfig, minutes: parseInt(e.target.value) || 0 })} className="w-12 bg-transparent text-slate-800 dark:text-white font-black text-2xl text-center focus:outline-none focus:text-indigo-500" />
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Mins</span>
                  </div>
                </motion.div>
              )}
              <div className="flex gap-2">
                <button onClick={isTimerRunning ? pauseTimer : startTimer} className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl ${isTimerRunning ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'}`}>
                  {isTimerRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                </button>
                <button onClick={resetTimer} className="w-16 h-16 bg-white dark:bg-slate-700/50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-white/5">
                  <X className="w-7 h-7" />
                </button>
                <button onClick={() => setIsFocusMode(true)} className="w-16 h-16 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-white/5 hover:border-white/10">
                  <Maximize2 className="w-7 h-7" />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -ml-40 -mt-40 pointer-events-none"></div>

            <div className="relative z-10 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-[#2C2C2E]">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Send className="w-7 h-7 text-indigo-500" />Cadastrar</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Preencha o desempenho em {globalModeloProva}</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-5 w-full md:w-auto">
                  <div className="w-full md:w-64">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.25em]">Identificação</label>
                    {cfgProvas.length > 0 ? (
                      <CustomDropdown
                        value={form.nomeProva}
                        onChange={v => setForm({ ...form, nomeProva: v })}
                        options={cfgProvas.map(p => ({ value: p, label: p }))}
                        placeholder="Ex: SAS, Evolucional..."
                        className="h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white"
                        onAddNewItem={async (val) => {
                          const novas = [...cfgProvas, val];
                          setCfgProvas(novas);
                          await updatePreferences({ provas: novas });
                          setForm({ ...form, nomeProva: val });
                          toast.success("Nova prova adicionada!");
                        }}
                      />
                    ) : (
                      <input type="text" placeholder="Ex: Simulado SAS" value={form.nomeProva} onChange={e => setForm({ ...form, nomeProva: e.target.value })} className="w-full h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white outline-none" />
                    )}
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.25em]">Ano</label>
                    {cfgAnos.length > 0 ? (
                      <CustomDropdown
                        value={form.anoProva}
                        onChange={v => setForm({ ...form, anoProva: v })}
                        options={cfgAnos.map(a => ({ value: a, label: a }))}
                        placeholder="2024"
                        className="h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white"
                        onAddNewItem={async (val) => {
                          const novas = [...cfgAnos, val];
                          setCfgAnos(novas);
                          await updatePreferences({ anos: novas });
                          setForm({ ...form, anoProva: val });
                          toast.success("Novo ano adicionado!");
                        }}
                      />
                    ) : (
                      <input type="text" placeholder="2024" value={form.anoProva} onChange={e => setForm({ ...form, anoProva: e.target.value })} className="w-full h-14 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-5 text-sm font-bold text-slate-700 dark:text-white outline-none" />
                    )}
                  </div>

                  <button onClick={handleSubmit} disabled={isSaving} className="h-14 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black px-10 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSaving ? "Salvando..." : "Finalizar" }
                  </button>
                </div>
              </div>

              <SimuladoFormFields form={form} setForm={setForm} modelo={modeloSelecionado} />
            </div>
          </section>
        </>
      )}

      {activeTab === "metricas" && simulados.length === 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-16 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center">
          <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum simulado registrado ainda.</p>
        </div>
      )}

      {activeTab === "metricas" && simulados.length > 0 && simuladosFiltrados.length === 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-16 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center text-center">
          <PieChart className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum simulado registrado para o modelo {globalModeloProva}.</p>
        </div>
      )}

      {activeTab === "metricas" && simuladosFiltrados.length > 0 && (
        <div className="space-y-6">
            <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Activity className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" /> Rendimento: {globalModeloProva}</h3><p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Evolução do Saldo de Acertos Líquidos</p></div>
              </div>
              <div className="h-[260px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGeneralAnalysisData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <defs><linearGradient id="gGr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0.1} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} content={<TooltipGeral />} />
                    <Legend verticalAlign="top" height={40} iconType="circle" />
                    <Bar dataKey="acertos" fill="url(#gGr)" radius={[12, 12, 0, 0]} barSize={60} name="Pontuação / Acertos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {globalModeloProva === 'ENEM' && (
               <>
                 <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Book className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" /> Análise: 1º Dia</h3><p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Linguagens e Ciências Humanas</p></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getChartDataDay1()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs><linearGradient id="lG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} /></linearGradient><linearGradient id="hG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} /></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip content={<TooltipD1 />} /><Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="linguagens" fill="url(#lG)" radius={[8, 8, 0, 0]} barSize={25} name="Linguagens" />
                         <Bar yAxisId="left" dataKey="humanas" fill="url(#hG)" radius={[8, 8, 0, 0]} barSize={25} name="Humanas" />
                         <Line yAxisId="right" type="monotone" dataKey="tempo1" stroke="#64748b" strokeWidth={4} dot={{ r: 6, fill: '#64748b', strokeWidth: 3, stroke: '#fff' }} name="Tempo D1" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-3"><PenTool className="w-6 h-6 md:w-7 md:h-7" /> Correlação: Redação</h3></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getRedacaoPerformanceData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1} /></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#f43f5e', fontWeight: 'bold' }} />
                         <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip content={<TooltipRedacao />} /><Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="nota" fill="url(#rG)" radius={[12, 12, 0, 0]} barSize={45} name="Redação" />
                         <Line yAxisId="right" type="stepAfter" dataKey="tempo" stroke="#64748b" strokeWidth={4} dot={{ r: 8, fill: '#64748b', strokeWidth: 4, stroke: '#fff' }} name="Tempo" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Activity className="w-6 h-6 md:w-7 md:h-7 text-blue-500" /> Análise: 2º Dia</h3></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getChartDataDay2()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs><linearGradient id="mG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} /></linearGradient><linearGradient id="nG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.1} /></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" domain={[0, 45]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip content={<TooltipD2 />} /><Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="matematica" fill="url(#mG)" radius={[8, 8, 0, 0]} barSize={35} name="Matemática" />
                         <Bar yAxisId="left" dataKey="naturezas" fill="url(#nG)" radius={[8, 8, 0, 0]} barSize={35} name="Natureza" />
                         <Line yAxisId="right" type="monotone" dataKey="tempo2" stroke="#64748b" strokeWidth={4} dot={{ r: 6, fill: '#64748b', strokeWidth: 3, stroke: '#fff' }} name="Tempo D2" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </>
            )}

            {globalModeloProva === 'UNB' && (
               <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-4">
                     <div><h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Activity className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" /> Penalidade UNB</h3><p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Comparativo de Acertos, Erros e Acertos Líquidos</p></div>
                   </div>
                   <div className="h-[260px] md:h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={getUNBAnalysisData()} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                         <defs>
                           <linearGradient id="cT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.1} /></linearGradient>
                           <linearGradient id="eT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1} /></linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                         <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                         <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} content={<TooltipGeral />} />
                         <Legend verticalAlign="top" height={40} iconType="circle" />
                         <Bar yAxisId="left" dataKey="Certo" fill="url(#cT)" radius={[8, 8, 0, 0]} barSize={25} />
                         <Bar yAxisId="left" dataKey="Errado" fill="url(#eT)" radius={[8, 8, 0, 0]} barSize={25} />
                         <Line yAxisId="left" type="monotone" dataKey="Liquido" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} name="Nota Líquida" />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
               </div>
            )}

            <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <Book className="w-6 h-6 text-indigo-500" /> Histórico
                </h3>
                <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full uppercase tracking-widest">{simuladosFiltrados.length} registros</span>
              </div>
              <div className="space-y-3">
                {simuladosFiltrados.map(sim => {
                  const dateStr = sim.realizado_em ? format(new Date(sim.realizado_em), "dd/MM/yyyy", { locale: ptBR }) : "";
                  return (
                    <div key={sim.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#2C2C2E]/60 rounded-2xl px-4 py-3 md:px-5 md:py-4 border border-slate-100 dark:border-white/5 group">
                      <div className="flex-1 min-w-0"><p className="font-black text-slate-800 dark:text-white text-sm truncate">{sim.titulo_simulado}</p><p className="text-xs text-slate-400 mt-0.5">{dateStr}</p></div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-2 rounded-md">{sim.acertos} / {sim.total_questoes} Acertos</span>
                        {sim.redacao > 0 && <span className="text-rose-500">✍️ {sim.redacao} red.</span>}
                        {sim.tempo_total_min > 0 && <span className="text-slate-400">⏱ {sim.tempo_total_min} min</span>}
                      </div>
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingSimulado(sim)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(sim.id)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all" title="Remover"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
        </div>
      )}

      <AnimatePresence>
        {isFocusMode && (
          <SimulatorOverlay
            getDisplayTime={getDisplayTime}
            timeLeft={timeLeft}
            timerConfig={timerConfig}
            setTimerConfig={setTimerConfig}
            isTimerRunning={isTimerRunning}
            pauseTimer={pauseTimer}
            startTimer={startTimer}
            resetTimer={resetTimer}
            showExactTime={showExactTime}
            setShowExactTime={setShowExactTime}
            onClose={() => setIsFocusMode(false)}
          />
        )}
        {editingSimulado && (
          <EditSimuladoModal
            sim={editingSimulado}
            cfgProvas={cfgProvas}
            cfgAnos={cfgAnos}
            onClose={() => setEditingSimulado(null)}
            onSave={(updated) => {
              setSimulados(prev => prev.map(s => s.id === updated.id ? updated : s));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SimulatorOverlay({
  getDisplayTime, timeLeft, timerConfig, setTimerConfig, isTimerRunning, pauseTimer, startTimer, resetTimer, showExactTime, setShowExactTime, onClose
}: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-10 text-white overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 z-20">
        <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1, ease: "linear" }} className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.6)]" />
      </div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -mr-60 -mt-60 z-0 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px] -ml-40 -mb-40 z-0 opacity-30"></div>
      <div className="absolute top-5 md:top-12 left-4 md:left-12 right-4 md:right-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden md:flex w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl items-center justify-center shadow-2xl">
            <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg md:text-3xl font-black tracking-tighter uppercase italic">Simulado Imersivo</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] mt-0.5">Status: {isTimerRunning ? 'Ativo' : 'Pausado'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => setShowExactTime(!showExactTime)} className="hidden md:block px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border border-white/10 backdrop-blur-md shadow-lg">{showExactTime ? "Mascara on" : "Ver exato"}</button>
          <button onClick={onClose} className="w-12 h-12 md:w-16 md:h-16 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white rounded-2xl flex items-center justify-center transition-all border border-white/10 backdrop-blur-md shadow-lg active:scale-95"><X className="w-5 h-5 md:w-7 md:h-7" /></button>
        </div>
      </div>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20, stiffness: 100 }} className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full scale-150 -z-10"></div>
          <div className="text-[5rem] sm:text-[8rem] md:text-[16rem] font-black font-mono tracking-tighter tabular-nums leading-none select-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500/20 drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)]">
            {getDisplayTime().split(':')[0]}:{getDisplayTime().split(':')[1]}
          </div>
          <div className="absolute -bottom-4 md:-bottom-8 right-0 text-3xl md:text-5xl font-black font-mono text-indigo-500/60 drop-shadow-lg">:{getDisplayTime().split(':')[2]}</div>
        </div>
        {!isTimerRunning && timeLeft === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6 items-center bg-white/5 backdrop-blur-3xl px-12 py-8 rounded-[3rem] border border-white/10 mt-12 shadow-2xl">
            <div className="flex flex-col items-center">
              <input type="number" min="0" value={timerConfig.hours} onChange={e => setTimerConfig({ ...timerConfig, hours: parseInt(e.target.value) || 0 })} className="w-24 bg-transparent text-white font-black text-5xl text-center focus:outline-none focus:text-indigo-400 transition-colors" />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Horas</span>
            </div>
            <span className="text-slate-700 font-black text-4xl mb-6">:</span>
            <div className="flex flex-col items-center">
              <input type="number" min="0" max="59" value={timerConfig.minutes} onChange={e => setTimerConfig({ ...timerConfig, minutes: parseInt(e.target.value) || 0 })} className="w-24 bg-transparent text-white font-black text-5xl text-center focus:outline-none focus:text-indigo-400 transition-colors" />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Minutos</span>
            </div>
          </motion.div>
        )}
        <div className="flex items-center justify-center gap-4 md:gap-8 mt-12 md:mt-24">
          <button onClick={isTimerRunning ? pauseTimer : startTimer} className={`w-24 h-24 md:w-36 md:h-36 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center transition-all active:scale-90 shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${isTimerRunning ? 'bg-amber-500 shadow-amber-500/20' : 'bg-white text-slate-950 shadow-white/10'}`}>
            {isTimerRunning ? <Pause className="w-10 h-10 md:w-14 md:h-14 fill-current" /> : <Play className="w-10 h-10 md:w-14 md:h-14 fill-current ml-1 md:ml-2" />}
          </button>
          <button onClick={resetTimer} className="w-24 h-24 md:w-36 md:h-36 bg-slate-800/80 hover:bg-slate-700 text-white rounded-[2rem] md:rounded-[3rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl border border-white/5 backdrop-blur-md">
            <X className="w-9 h-9 md:w-12 md:h-12" />
          </button>
        </div>
      </motion.div>
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center z-10">
        <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-2xl px-10 py-4 rounded-full border border-white/5 shadow-2xl">
          <div className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`}></div>
          <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">Mentoria • High Performance</p>
        </div>
      </div>
    </motion.div>
  );
}
