import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  listarProblemas, concluirProblema, deletarProblema, criarProblemaManual, atualizarProblema,
  type ProblemaEstudo, type OrigemProblema, ORIGEM_LABELS, ORIGEM_COLORS, TIPO_ERRO_LABELS, TIPO_ERRO_COLORS
} from "@/lib/db/estudo";
import { createClient } from "@/utils/supabase/client";
import { Trash, CheckCircle2, AlertCircle, Inbox, Plus, X, Activity, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ModuleTarefasKevQuest({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const origem: OrigemProblema = "kevquest";
  const [problemas, setProblemas] = useState<ProblemaEstudo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Modals
  const [modalConcluir, setModalConcluir] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [modalEditar, setModalEditar] = useState<{ open: boolean; prob: ProblemaEstudo | null }>({ open: false, prob: null });
  const [formEditar, setFormEditar] = useState({ titulo: '', data: '', prioridade: 0 });
  
  const [formConcluir, setFormConcluir] = useState({ tempo: '', conforto: 0, questoes: 0, acertos: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await fetchProblemas(user.id);
    };
    init();
  }, [refreshTrigger]);

  const fetchProblemas = async (uid: string) => {
    const todos = await listarProblemas(uid);
    setProblemas(todos.filter(p => p.origem === 'kevquest' && p.tipo_erro === null));
    setIsLoaded(true);
  };

  const refresh = () => {
    if (userId) fetchProblemas(userId);
  };

  const handleDeletar = async (id: string) => {
    if (confirm("Excluir esta tarefa?")) {
      const ok = await deletarProblema(id);
      if (ok) {
        toast.success("Tarefa excluída");
        refresh();
      }
    }
  };

  const handleConcluir = async () => {
    if (!modalConcluir.id) return;
    setIsSaving(true);
    const ok = await concluirProblema(
      modalConcluir.id,
      {
        conforto: formConcluir.conforto || null,
        questoesFeitas: formConcluir.questoes,
        acertos: formConcluir.acertos
      }
    );
    if (ok) {
      toast.success('Tarefa concluída!');
      setModalConcluir({ open: false, id: null });
      setFormConcluir({ tempo: '', conforto: 0, questoes: 0, acertos: 0 });
      refresh();
    } else {
      toast.error('Erro ao concluir tarefa.');
    }
    setIsSaving(false);
  };

  const handleEditar = async () => {
    if (!modalEditar.prob) return;
    setIsSaving(true);
    const ok = await atualizarProblema(modalEditar.prob.id, {
      titulo: formEditar.titulo,
      agendadoPara: formEditar.data || null,
      prioridade: formEditar.prioridade
    });
    if (ok) {
      toast.success('Tarefa atualizada!');
      setModalEditar({ open: false, prob: null });
      refresh();
    } else {
      toast.error('Erro ao atualizar.');
    }
    setIsSaving(false);
  };

  const hoje = new Date().toISOString().split('T')[0];
  const paraHoje = problemas.filter(p => p.status === 'pendente' && p.agendado_para === hoje);
  const fila = problemas.filter(p => p.status === 'pendente' && p.agendado_para !== hoje);

  const ProblemaCard = ({ prob, showDate = true }: { prob: ProblemaEstudo; showDate?: boolean }) => {
    return (
      <div className={`bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 flex flex-col justify-between gap-4 border transition-all hover:bg-slate-50 dark:hover:bg-[#2C2C2E] ${
        prob.prioridade === 1 ? 'border-orange-200 dark:border-orange-500/30 shadow-lg shadow-orange-500/5' : 'border-slate-100 dark:border-[#2C2C2E]'
      }`}>
        <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                    {prob.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        {prob.prioridade === 1 && <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md">Urgente</span>}
                        {showDate && prob.agendado_para && <span className="text-[10px] font-bold text-slate-400">{new Date(prob.agendado_para + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    </div>
                </div>
            </div>
            <div className="flex gap-1">
                <button
                    onClick={() => {
                        setModalEditar({ open: true, prob: prob });
                        setFormEditar({ titulo: prob.titulo, data: prob.agendado_para || '', prioridade: prob.prioridade });
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:text-slate-600 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition-all"
                    title="Editar"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleDeletar(prob.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:text-slate-600 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all"
                    title="Excluir"
                >
                    <Trash className="w-4 h-4" />
                </button>
            </div>
        </div>

        <button
          onClick={() => setModalConcluir({ open: true, id: prob.id })}
          className="w-full bg-[#1B2B5E] hover:bg-blue-900 text-white text-xs font-black py-4 rounded-2xl uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-[#1B2B5E]/20 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Concluir Tarefa
        </button>
      </div>
    );
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Carregando tarefas...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {paraHoje.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-[#F97316]" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              Para Hoje
            </h2>
            <span className="text-xs font-black text-slate-400">({paraHoje.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paraHoje.map(p => <ProblemaCard key={p.id} prob={p} showDate={false} />)}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4 mt-8">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Inbox className="w-4 h-4 text-slate-500" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
            Fila (Agendados Futuros ou Sem Data)
          </h2>
          <span className="text-xs font-black text-slate-400">({fila.length})</span>
        </div>
        {fila.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-12 border border-slate-100 dark:border-[#2C2C2E] text-center text-slate-400 text-sm font-medium">
            Sua fila está vazia. Ótimo trabalho!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fila.map(p => <ProblemaCard key={p.id} prob={p} />)}
          </div>
        )}
      </div>

      {/* Modal Concluir */}
      {modalConcluir.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-sm:max-w-sm shadow-2xl overflow-hidden p-10 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 text-slate-800 dark:text-white">Concluir Tarefa</h2>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Questões Feitas</label>
                    <input 
                        type="number" 
                        value={formConcluir.questoes} 
                        onChange={e => setFormConcluir({...formConcluir, questoes: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Acertos</label>
                    <input 
                        type="number" 
                        value={formConcluir.acertos} 
                        onChange={e => setFormConcluir({...formConcluir, acertos: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => setModalConcluir({open:false, id:null})} className="flex-1 py-4 text-sm font-black text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest">Cancelar</button>
              <button onClick={handleConcluir} disabled={isSaving} className="flex-1 py-4 bg-[#1B2B5E] text-white text-sm font-black rounded-2xl shadow-xl shadow-[#1B2B5E]/20 disabled:opacity-50 transition-all active:scale-95 uppercase tracking-widest">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Pencil className="w-6 h-6 text-indigo-500" />
                        Editar Tarefa
                    </h2>
                    <button onClick={() => setModalEditar({open:false, prob:null})} className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Título da Tarefa</label>
                        <input 
                            type="text" 
                            value={formEditar.titulo} 
                            onChange={e => setFormEditar({...formEditar, titulo: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Agendado para</label>
                            <input 
                                type="date" 
                                value={formEditar.data} 
                                onChange={e => setFormEditar({...formEditar, data: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.25em]">Prioridade</label>
                            <select 
                                value={formEditar.prioridade} 
                                onChange={e => setFormEditar({...formEditar, prioridade: parseInt(e.target.value)})}
                                className="w-full bg-slate-50 dark:bg-[#2C2C2E] border-2 border-slate-100 dark:border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value={0}>Normal</option>
                                <option value={1}>Urgente</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-10">
                    <button onClick={() => setModalEditar({open:false, prob:null})} className="flex-1 py-4 text-sm font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest">
                        Cancelar
                    </button>
                    <button onClick={handleEditar} disabled={isSaving || !formEditar.titulo.trim()} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
