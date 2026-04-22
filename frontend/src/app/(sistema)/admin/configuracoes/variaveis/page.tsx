"use client";

import { useState, useEffect } from "react";
import {
  Settings, Plus, X, Loader2, Save, BookOpen, Trash2, ChevronDown,
  CheckCircle2, AlertCircle, Users, Globe, RefreshCw, Layers, Tag, Palette, Activity, Calendar
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type PlatConfig = {
  id: string;
  provas: string[];
  anos: string[];
  cores: string[];
  motivos: string[];
  aplicacoes: string[];
};

type ConfigField = "provas" | "anos" | "cores" | "motivos" | "aplicacoes";

// ─── Chip Tag Component ───────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-black group transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-100 dark:border-transparent">
      {label}
      <button
        onClick={onRemove}
        className="text-slate-300 dark:text-slate-500 hover:text-rose-500 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Variable Section Card ────────────────────────────────────────────────────
function VarSection({
  icon, title, desc, items, onAdd, onRemove, accentColor = "indigo"
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  items: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
  accentColor?: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput("");
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-5 transition-all hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-black/20">
      <div className="flex items-center gap-3">
        <div className={`bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-2xl`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">{title}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{desc}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Adicionar novo..."
          className="flex-1 min-w-0 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent focus:border-indigo-500/50 rounded-2xl py-3.5 px-5 text-sm font-bold transition-all outline-none text-slate-700 dark:text-white placeholder-slate-400"
        />
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-5 rounded-2xl hover:bg-indigo-700 transition-all flex-shrink-0 shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
        <div className="flex flex-wrap gap-2">
          {[...items].sort().map((item) => (
            <Chip key={item} label={item} onRemove={() => onRemove(item)} />
          ))}
          {items.length === 0 && (
            <div className="w-full py-8 text-center text-slate-300 italic text-xs font-bold uppercase tracking-widest">
              Nenhum item adicionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GlobalConfigPage() {
  const supabase = createClient();

  const [config, setConfig] = useState<PlatConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPropagating, setIsPropagating] = useState(false);
  const [activeTab, setActiveTab] = useState<"variaveis" | "disciplinas">("variaveis");

  // Disciplinas State
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [newDisciplina, setNewDisciplina] = useState("");
  const [selectedDiscId, setSelectedDiscId] = useState("");
  const [newConteudo, setNewConteudo] = useState("");

  const loadAll = async () => {
    setIsLoading(true);
    const [cfgRes, discRes] = await Promise.all([
      supabase.from("plataforma_config").select("*").eq("id", "11111111-1111-1111-1111-111111111111").single(),
      supabase.from("disciplinas").select("*, conteudos(*)").is("user_id", null).order("ordem", { ascending: true })
    ]);

    if (cfgRes.data) setConfig(cfgRes.data as PlatConfig);
    if (discRes.data) setDisciplinas(discRes.data);
    if (discRes.error) toast.error("Erro ao carregar disciplinas: " + discRes.error.message);

    setIsLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ─── Config Handlers ──────────────────────────────────────────────────────
  const handleAddItem = (field: ConfigField, value: string) => {
    if (!value.trim() || !config) return;
    const current = config[field] || [];
    if (!current.includes(value.trim())) {
      setConfig({ ...config, [field]: [...current, value.trim()] });
    }
  };

  const handleRemoveItem = (field: ConfigField, value: string) => {
    if (!config) return;
    setConfig({ ...config, [field]: (config[field] || []).filter((v) => v !== value) });
  };

  /**
   * Saves config to plataforma_config and propagates changes to ALL user_preferences.
   * Calls a Supabase RPC to bypass RLS for user_preferences.
   */
  const saveAndPropagate = async () => {
    if (!config) return;
    setIsSaving(true);
    setIsPropagating(true);

    const { data, error } = await supabase.rpc('admin_propagate_platform_config', {
      p_provas: config.provas,
      p_anos: config.anos,
      p_cores: config.cores,
      p_motivos: config.motivos,
      p_aplicacoes: config.aplicacoes
    });

    setIsPropagating(false);
    setIsSaving(false);

    if (error) {
      toast.error("Erro ao propagar configurações: " + error.message);
    } else {
      toast.success("Variáveis salvas e propagadas para todos os alunos!");
    }
  };

  // ─── Disciplina Handlers ──────────────────────────────────────────────────
  const handleAddDisciplina = async () => {
    if (!newDisciplina.trim()) return;
    const { data, error } = await supabase
      .from("disciplinas")
      .insert({ nome: newDisciplina.trim(), cor_hex: "#6366F1", ordem: disciplinas.length, user_id: null })
      .select("*, conteudos(*)")
      .single();

    if (error) { toast.error("Erro ao adicionar disciplina."); return; }
    if (data) {
      setDisciplinas([...disciplinas, data]);
      setNewDisciplina("");
      toast.success("Disciplina adicionada!");
    }
  };

  const handleDeleteDisciplina = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja apagar a disciplina "${nome}"?`)) return;
    const { error } = await supabase.from("disciplinas").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    setDisciplinas(disciplinas.filter(d => d.id !== id));
    if (selectedDiscId === id) setSelectedDiscId("");
    toast.success("Disciplina removida!");
  };

  const handleAddConteudo = async () => {
    if (!newConteudo.trim() || !selectedDiscId) return;
    const disc = disciplinas.find(d => d.id === selectedDiscId);
    const { data, error } = await supabase
      .from("conteudos")
      .insert({ disciplina_id: selectedDiscId, nome: newConteudo.trim(), ordem: disc?.conteudos?.length || 0, user_id: null })
      .select()
      .single();

    if (error) { toast.error("Erro ao adicionar conteúdo."); return; }
    if (data) {
      setDisciplinas(disciplinas.map(d => d.id === selectedDiscId ? { ...d, conteudos: [...(d.conteudos || []), data] } : d));
      setNewConteudo("");
      toast.success("Conteúdo adicionado!");
    }
  };

  const handleDeleteConteudo = async (disciplinaId: string, conteudoId: string) => {
    const { error } = await supabase.from("conteudos").delete().eq("id", conteudoId);
    if (error) { toast.error("Erro ao excluir conteúdo."); return; }
    setDisciplinas(disciplinas.map(d => d.id === disciplinaId ? { ...d, conteudos: d.conteudos.filter((c: any) => c.id !== conteudoId) } : d));
  };

  const selectedDisc = disciplinas.find(d => d.id === selectedDiscId);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto pb-24 px-6">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-indigo-600 p-3 rounded-[1.5rem] shadow-xl shadow-indigo-600/20">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
              Variáveis Padrão
            </h1>
          </div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.25em] ml-2">Configuração Global da Plataforma</p>
        </div>

        {activeTab === "variaveis" && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={saveAndPropagate}
              disabled={isSaving || isPropagating}
              className="flex items-center justify-center gap-2 bg-[#1B2B5E] hover:bg-blue-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-900/10 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
              {isPropagating ? "Propagando..." : isSaving ? "Salvando..." : "Salvar e Propagar"}
            </button>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Users className="w-3 h-3 text-indigo-400" />
              Atualiza as variáveis de todos os alunos
            </div>
          </div>
        )}
      </header>

      {/* Info Banner */}
      {activeTab === "variaveis" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl px-6 py-4 flex items-start gap-3"
        >
          <RefreshCw className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">Propagação Global Ativa</p>
            <p className="text-xs text-indigo-500/80 dark:text-indigo-400/80 mt-0.5">
              Ao clicar em <strong>"Salvar e Propagar"</strong>, as variáveis serão salvas como padrão da plataforma <strong>e</strong> sobrescreverão as variáveis de todos os alunos cadastrados. Use com atenção.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-[2rem] flex items-center w-full border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
        <button
          onClick={() => setActiveTab("variaveis")}
          className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] flex items-center justify-center gap-2 ${
            activeTab === "variaveis"
              ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20"
              : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          Variáveis
        </button>
        <button
          onClick={() => setActiveTab("disciplinas")}
          className={`flex-1 py-4 text-sm font-black rounded-[1.8rem] transition-all duration-200 uppercase tracking-[0.18em] flex items-center justify-center gap-2 ${
            activeTab === "disciplinas"
              ? "bg-[#1B2B5E] text-white shadow-lg shadow-[#1B2B5E]/20"
              : "text-slate-400 dark:text-[#A1A1AA] hover:text-slate-600 dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Eixos Curriculares
        </button>
      </div>

      {/* ABA: VARIÁVEIS */}
      <AnimatePresence mode="wait">
        {activeTab === "variaveis" && (
          <motion.div
            key="variaveis"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <VarSection
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              title="Bancas & Provas"
              desc="Opções padrão de vestibulares"
              items={config?.provas || []}
              onAdd={(v) => handleAddItem("provas", v)}
              onRemove={(v) => handleRemoveItem("provas", v)}
            />
            <VarSection
              icon={<Palette className="w-5 h-5 text-rose-500" />}
              title="Sistema de Cores"
              desc="Cores dos cadernos de prova"
              items={config?.cores || []}
              onAdd={(v) => handleAddItem("cores", v)}
              onRemove={(v) => handleRemoveItem("cores", v)}
            />
            <VarSection
              icon={<Activity className="w-5 h-5 text-indigo-500" />}
              title="Tipos de Aplicação"
              desc="Modalidades de participação no vestibular"
              items={config?.aplicacoes || []}
              onAdd={(v) => handleAddItem("aplicacoes", v)}
              onRemove={(v) => handleRemoveItem("aplicacoes", v)}
            />
          </motion.div>
        )}

        {/* ABA: DISCIPLINAS */}
        {activeTab === "disciplinas" && (
          <motion.div
            key="disciplinas"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Disciplinas List */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-2xl">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Disciplinas Globais</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Matérias disponíveis para todos os alunos</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDisciplina}
                  onChange={(e) => setNewDisciplina(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDisciplina()}
                  placeholder="Nova disciplina..."
                  className="flex-1 min-w-0 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent focus:border-indigo-500/50 rounded-2xl py-3.5 px-5 text-sm font-bold transition-all outline-none text-slate-700 dark:text-white placeholder-slate-400"
                />
                <button
                  onClick={handleAddDisciplina}
                  className="bg-indigo-600 text-white px-5 rounded-2xl hover:bg-indigo-700 transition-all flex-shrink-0 shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {disciplinas.length === 0 && (
                  <div className="py-8 text-center text-slate-300 italic text-xs font-bold uppercase tracking-widest">Nenhuma disciplina cadastrada</div>
                )}
                {disciplinas.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDiscId(d.id === selectedDiscId ? "" : d.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all border ${
                      selectedDiscId === d.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                        : "border-slate-100 dark:border-[#2C2C2E] hover:border-slate-200 dark:hover:border-[#3A3A3C]"
                    }`}
                  >
                    <div>
                      <p className={`font-black text-sm ${selectedDiscId === d.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-white"}`}>{d.nome}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{d.conteudos?.length || 0} conteúdos</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDisciplina(d.id, d.nome); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Conteúdos of selected discipline */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-2xl">
                  <Tag className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    {selectedDisc ? `Conteúdos — ${selectedDisc.nome}` : "Mapeamento de Conteúdos"}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    {selectedDisc ? "Tópicos desta matéria" : "Selecione uma disciplina ao lado"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConteudo}
                  onChange={(e) => setNewConteudo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddConteudo()}
                  placeholder={selectedDisc ? "Novo conteúdo..." : "Selecione uma disciplina primeiro"}
                  disabled={!selectedDisc}
                  className="flex-1 min-w-0 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent focus:border-indigo-500/50 rounded-2xl py-3.5 px-5 text-sm font-bold transition-all outline-none disabled:opacity-50 text-slate-700 dark:text-white placeholder-slate-400"
                />
                <button
                  onClick={handleAddConteudo}
                  disabled={!selectedDisc}
                  className="bg-emerald-600 text-white px-5 rounded-2xl hover:bg-emerald-700 transition-all flex-shrink-0 shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {!selectedDisc && (
                    <div className="w-full py-12 text-center text-slate-300 italic text-xs font-bold uppercase tracking-widest">
                      Nenhuma disciplina selecionada
                    </div>
                  )}
                  {selectedDisc && (selectedDisc.conteudos || []).length === 0 && (
                    <div className="w-full py-12 text-center text-slate-300 italic text-xs font-bold uppercase tracking-widest">
                      Nenhum conteúdo cadastrado
                    </div>
                  )}
                  {selectedDisc && [...(selectedDisc.conteudos || [])].sort((a: any, b: any) => a.nome.localeCompare(b.nome)).map((c: any) => (
                    <Chip
                      key={c.id}
                      label={c.nome}
                      onRemove={() => handleDeleteConteudo(selectedDisc.id, c.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
