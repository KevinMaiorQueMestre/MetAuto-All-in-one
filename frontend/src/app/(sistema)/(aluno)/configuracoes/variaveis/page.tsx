"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, X, BookOpen, Trash2, Loader2, RefreshCw, Info, FileText, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getDisciplinas, addDisciplina, deleteDisciplina, addConteudo, deleteConteudo, Disciplina, Conteudo } from "@/lib/db/disciplinas";
import { getPreferences, updatePreferences } from "@/lib/db/preferences";

export default function VariaveisPage() {
  const router = useRouter();

  // ── Disciplinas ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [dbDisciplinas, setDbDisciplinas] = useState<Disciplina[]>([]);
  const [newDisciplina, setNewDisciplina] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // ── Aplicações de prova ───────────────────────────────────────
  const [aplicacoes, setAplicacoes] = useState<string[]>([]);
  const [newAplicacao, setNewAplicacao] = useState("");
  const [isAddingAp, setIsAddingAp] = useState(false);

  // ── Cores de prova ────────────────────────────────────────────
  const [cores, setCores] = useState<string[]>([]);
  const [newCor, setNewCor] = useState("");
  const [isAddingCor, setIsAddingCor] = useState(false);

  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    loadDisciplinas();
    loadPrefs();
  }, []);

  const loadDisciplinas = async () => {
    setLoading(true);
    const dr = await getDisciplinas();
    setDbDisciplinas(dr);
    setLoading(false);
  };

  const loadPrefs = async () => {
    setLoadingPrefs(true);
    const prefs = await getPreferences();
    setAplicacoes(prefs.aplicacoes || []);
    setCores(prefs.cores || []);
    setLoadingPrefs(false);
  };

  // ── Handlers Disciplinas ──────────────────────────────────────
  const handleAddDisciplina = async () => {
    if (!newDisciplina.trim()) return;
    setIsAdding(true);
    const added = await addDisciplina(newDisciplina.trim());
    if (added) {
      setDbDisciplinas(prev => [...prev, { ...added, conteudos: [] }]);
      setNewDisciplina("");
      toast.success("Disciplina adicionada com sucesso!");
    } else {
      toast.error("Erro ao adicionar disciplina.");
    }
    setIsAdding(false);
  };

  const handleDeleteDisciplina = async (id: string) => {
    const ok = await deleteDisciplina(id);
    if (ok) {
      setDbDisciplinas(prev => prev.filter(d => d.id !== id));
      toast.success("Disciplina excluída!");
    } else {
      toast.error("Erro ao excluir disciplina. Ela pode estar em uso.");
    }
  };

  const handleAddConteudo = async (disciplinaId: string, nomeConteudo: string, clear: () => void) => {
    if (!nomeConteudo.trim()) return;
    const added = await addConteudo(disciplinaId, nomeConteudo.trim());
    if (added) {
      setDbDisciplinas(prev => prev.map(d =>
        d.id === disciplinaId ? { ...d, conteudos: [...(d.conteudos || []), added] } : d
      ));
      clear();
      toast.success("Conteúdo adicionado!");
    } else {
      toast.error("Erro ao adicionar conteúdo.");
    }
  };

  const handleDeleteConteudo = async (disciplinaId: string, id: string) => {
    const ok = await deleteConteudo(id);
    if (ok) {
      setDbDisciplinas(prev => prev.map(d =>
        d.id === disciplinaId ? { ...d, conteudos: (d.conteudos || []).filter(c => c.id !== id) } : d
      ));
      toast.success("Conteúdo excluído!");
    } else {
      toast.error("Erro ao excluir conteúdo. Ele pode estar vinculado a questões existentes.");
    }
  };

  // ── Handlers Aplicações ───────────────────────────────────────
  const handleAddAplicacao = async () => {
    const val = newAplicacao.trim();
    if (!val) return;
    if (aplicacoes.includes(val)) { toast.error("Essa aplicação já existe!"); return; }
    setIsAddingAp(true);
    const newList = [...aplicacoes, val];
    const ok = await updatePreferences({ aplicacoes: newList });
    if (ok) { setAplicacoes(newList); setNewAplicacao(""); toast.success(`Aplicação "${val}" adicionada!`); }
    else { toast.error("Erro ao salvar aplicação."); }
    setIsAddingAp(false);
  };

  const handleDeleteAplicacao = async (ap: string) => {
    const newList = aplicacoes.filter(a => a !== ap);
    const ok = await updatePreferences({ aplicacoes: newList });
    if (ok) { setAplicacoes(newList); toast.success(`Aplicação "${ap}" removida!`); }
    else { toast.error("Erro ao remover aplicação."); }
  };

  // ── Handlers Cores ────────────────────────────────────────────
  const handleAddCor = async () => {
    const val = newCor.trim();
    if (!val) return;
    if (cores.includes(val)) { toast.error("Essa cor já existe!"); return; }
    setIsAddingCor(true);
    const newList = [...cores, val];
    const ok = await updatePreferences({ cores: newList });
    if (ok) { setCores(newList); setNewCor(""); toast.success(`Cor "${val}" adicionada!`); }
    else { toast.error("Erro ao salvar cor."); }
    setIsAddingCor(false);
  };

  const handleDeleteCor = async (cor: string) => {
    const newList = cores.filter(c => c !== cor);
    const ok = await updatePreferences({ cores: newList });
    if (ok) { setCores(newList); toast.success(`Cor "${cor}" removida!`); }
    else { toast.error("Erro ao remover cor."); }
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto pb-24">

      {/* ── HEADER ── */}
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.push("/configuracoes")}
          className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            Grade Curricular
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.15em] mt-1.5 ml-1">
            Suas matérias e configurações de estudo
          </p>
        </div>
        <button
          onClick={() => { loadDisciplinas(); loadPrefs(); }}
          disabled={loading || loadingPrefs}
          className="p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all active:scale-95 shadow-sm"
          title="Recarregar"
        >
          <RefreshCw className={`w-4 h-4 ${loading || loadingPrefs ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* ── APLICAÇÕES DE PROVA ── */}
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] space-y-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">Aplicações de Prova</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Usadas na criação de simulados (Regular, PPL, Digital…)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newAplicacao}
            onChange={e => setNewAplicacao(e.target.value)}
            placeholder="Ex: Reaplicação, Digital, PPL..."
            onKeyDown={e => e.key === "Enter" && !isAddingAp && handleAddAplicacao()}
            className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-indigo-400/60 dark:focus:border-indigo-500/40 rounded-xl py-3 px-5 text-sm font-bold transition-all outline-none placeholder-slate-400"
          />
          <button
            onClick={handleAddAplicacao}
            disabled={isAddingAp || !newAplicacao.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            {isAddingAp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>

        {loadingPrefs ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : aplicacoes.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">Nenhuma aplicação cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {aplicacoes.map(ap => (
              <div key={ap} className="group flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-2 rounded-2xl transition-all">
                <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{ap}</span>
                <button
                  onClick={() => handleDeleteAplicacao(ap)}
                  className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-red-500 transition-all"
                  title={`Remover "${ap}"`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── CORES DE PROVA ── */}
      <section className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] space-y-5">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500 p-2 rounded-xl shadow-lg shadow-rose-500/20">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">Cores de Prova</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Identificação visual dos cadernos (Azul, Rosa, Amarela…)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newCor}
            onChange={e => setNewCor(e.target.value)}
            placeholder="Ex: Azul, Rosa, Branca..."
            onKeyDown={e => e.key === "Enter" && !isAddingCor && handleAddCor()}
            className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-rose-400/60 dark:focus:border-rose-500/40 rounded-xl py-3 px-5 text-sm font-bold transition-all outline-none placeholder-slate-400"
          />
          <button
            onClick={handleAddCor}
            disabled={isAddingCor || !newCor.trim()}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            {isAddingCor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>

        {loadingPrefs ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
          </div>
        ) : cores.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">Nenhuma cor cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cores.map(cor => (
              <div key={cor} className="group flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-4 py-2 rounded-2xl transition-all">
                <span className="text-sm font-black text-rose-700 dark:text-rose-300">{cor}</span>
                <button
                  onClick={() => handleDeleteCor(cor)}
                  className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-red-600 transition-all"
                  title={`Remover "${cor}"`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── DISCIPLINAS ── */}
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Suas disciplinas personalizadas</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
            Adicione suas próprias matérias aqui para usá-las no KevQuest e no Módulo de Estudo.
            As disciplinas globais da plataforma já estão disponíveis automaticamente.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
        <h2 className="text-lg font-black text-slate-800 dark:text-white mb-4">Adicionar Nova Disciplina</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newDisciplina}
            onChange={e => setNewDisciplina(e.target.value)}
            placeholder="Ex: Física, Cálculo I, Redação..."
            onKeyDown={e => e.key === "Enter" && !isAdding && handleAddDisciplina()}
            className="flex-1 bg-slate-50 dark:bg-[#2C2C2E] border-2 border-transparent focus:border-amber-400/60 dark:focus:border-amber-500/40 rounded-xl py-3 px-5 text-sm font-bold transition-all outline-none placeholder-slate-400"
          />
          <button
            onClick={handleAddDisciplina}
            disabled={isAdding || !newDisciplina.trim()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : dbDisciplinas.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-14 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-500 mb-1">Nenhuma Disciplina Personalizada</h3>
          <p className="text-sm text-slate-400 max-w-md">
            Adicione suas matérias acima. As disciplinas globais da plataforma já estão disponíveis no KevQuest automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dbDisciplinas.map((disc, idx) => (
            <DisciplinaCard
              key={disc.id || idx}
              disciplina={disc}
              onDelete={() => handleDeleteDisciplina(disc.id)}
              onAddConteudo={handleAddConteudo}
              onDeleteConteudo={handleDeleteConteudo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DisciplinaCard({ disciplina, onDelete, onAddConteudo, onDeleteConteudo }: {
  disciplina: Disciplina;
  onDelete: () => void;
  onAddConteudo: (discId: string, nome: string, clear: () => void) => Promise<void>;
  onDeleteConteudo: (discId: string, contId: string) => Promise<void>;
}) {
  const [newConteudo, setNewConteudo] = useState("");
  const [isGlobal] = useState(!disciplina.user_id);

  const handleAdd = () => {
    if (!newConteudo.trim()) return;
    onAddConteudo(disciplina.id, newConteudo, () => setNewConteudo(""));
  };

  const conteudos = [...(disciplina.conteudos || [])].sort((a, b) => a.ordem - b.ordem);
  const corHex = disciplina.cor_hex || "#6366F1";

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col h-[420px] relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2rem]" style={{ backgroundColor: corHex }} />

      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2C2C2E] mb-4 pt-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-3 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: corHex }} />
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-800 dark:text-white truncate" title={disciplina.nome}>
              {disciplina.nome}
            </h3>
            {isGlobal && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global</span>}
          </div>
        </div>
        {!isGlobal ? (
          <button
            onClick={onDelete}
            className="text-slate-300 hover:text-red-500 transition-colors p-2 flex-shrink-0 opacity-0 group-hover:opacity-100"
            title="Deletar Disciplina"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-[#2C2C2E] text-slate-400 px-2 py-1 rounded-lg uppercase tracking-wider flex-shrink-0">
            Padrão
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {conteudos.map((cont: Conteudo) => (
          <div key={cont.id} className="flex items-start justify-between gap-2 bg-slate-50 dark:bg-[#2C2C2E] rounded-xl px-3 py-2.5 group/item">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 leading-snug">{cont.nome}</span>
            <button
              onClick={() => onDeleteConteudo(disciplina.id, cont.id)}
              className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 -mt-0.5 -mr-0.5 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {conteudos.length === 0 && (
          <span className="text-xs text-slate-400 italic block text-center py-4">Nenhum conteúdo adicionado</span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2C2C2E]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newConteudo}
            onChange={e => setNewConteudo(e.target.value)}
            placeholder="Novo conteúdo..."
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="flex-1 min-w-0 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent focus:border-amber-400/60 rounded-xl py-2 px-3 text-xs font-bold transition-all outline-none placeholder-slate-400"
          />
          <button
            onClick={handleAdd}
            className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex-shrink-0 border border-amber-100 dark:border-transparent"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
