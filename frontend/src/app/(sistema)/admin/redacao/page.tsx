"use client";

import React, { useState, useEffect } from "react";
import {
  PenTool, Plus, Trash2, ArrowRight, Lightbulb,
  ClipboardCheck, Award, FileText,
  X, Star, Calendar, GripVertical, CheckCircle2, FileImage, User, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { format as formatDate } from "date-fns";
import { createClient } from "@/utils/supabase/client";

type AdminStatus = "enviada" | "avaliando" | "corrigida";

interface RespostaAdmin {
   feedback: string;
   nota: number;
   arquivos: string[];
}

interface RedacaoGlobal {
  id: string;
  studentName: string;
  titulo: string;
  tema: string;
  dataCriacao: string;
  status: "rascunho" | AdminStatus;
  tempoMinutos?: number | null;
  imagens: string[];
  respostaAdmin?: RespostaAdmin;
}

interface TemaProposta {
  id: string;
  titulo: string;
  tema: string;
  dataCriacao: string;
}

const COLUMNS: {
  id: AdminStatus;
  label: string;
  icon: React.ComponentType<any>;
  accent: string;
  dot: string;
  card: string;
  badge: string;
  emptyText: string;
}[] = [
  {
    id: "enviada",
    label: "A Corrigir",
    icon: FileText,
    accent: "text-amber-500",
    dot: "bg-amber-500",
    card: "hover:border-amber-200 dark:hover:border-amber-900/60",
    badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    emptyText: "Nenhuma nova redação.",
  },
  {
    id: "avaliando",
    label: "Em Avaliação",
    icon: ClipboardCheck,
    accent: "text-indigo-500",
    dot: "bg-indigo-500",
    card: "hover:border-indigo-200 dark:hover:border-indigo-900/60",
    badge: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
    emptyText: "Arraste uma redação para avaliação.",
  },
  {
    id: "corrigida",
    label: "Devolvida",
    icon: Award,
    accent: "text-teal-500",
    dot: "bg-teal-500",
    card: "hover:border-teal-200 dark:hover:border-teal-900/60",
    badge: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
    emptyText: "Sem entregas finalizadas.",
  },
];

// ─── ADMIN KANBAN CARD ────────────────────────────────────────────────────────
function AdminRedacaoCard({
  redacao,
  col,
  onOpenCorrecao,
}: {
  redacao: RedacaoGlobal;
  col: typeof COLUMNS[number];
  onOpenCorrecao: (r: RedacaoGlobal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: redacao.id, data: { status: redacao.status } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`group bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm transition-all ${col.card} ${isDragging ? "shadow-xl ring-2 ring-indigo-400/40" : ""}`}>
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="mt-0.5 p-1 -ml-1 text-slate-300 dark:text-[#3A3A3C] cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center flex-shrink-0">
                   <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider">{redacao.studentName}</span>
             </div>

            <h3 className="font-black text-slate-800 dark:text-white text-sm leading-snug mb-1">
              {redacao.titulo}
            </h3>
            
            {redacao.imagens && redacao.imagens.length > 0 && (
               <div className="flex items-center gap-2 mb-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md">
                     <FileImage className="w-3 h-3" /> {redacao.imagens.length} Anexos
                  </span>
               </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-[#52525B] font-bold uppercase">
                   <Calendar className="w-3 h-3" />
                   {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                 </div>
                 {redacao.status === "corrigida" && redacao.respostaAdmin && (
                    <span className="flex items-center gap-1 text-xs font-black text-teal-600 dark:text-teal-400">
                       <Star className="w-3.5 h-3.5 fill-current" /> {redacao.respostaAdmin.nota}
                    </span>
                 )}
                 {redacao.status !== "corrigida" && (
                    <button onClick={() => onOpenCorrecao(redacao)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${col.badge} hover:brightness-95 flex items-center gap-1`}>
                       Avaliar <ArrowRight className="w-3 h-3" />
                    </button>
                 )}
                 {redacao.status === "corrigida" && (
                     <button onClick={() => onOpenCorrecao(redacao)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${col.badge} hover:brightness-95 flex items-center gap-1`}>
                       Ver Envios
                    </button>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  col, items, onOpenCorrecao
}: {
  col: typeof COLUMNS[number]; items: RedacaoGlobal[]; onOpenCorrecao: (r: RedacaoGlobal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${col.accent}`}>{col.label}</h2>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${col.badge}`}>{items.length}</span>
      </div>

      <div ref={setNodeRef} className={`flex-1 min-h-[60vh] rounded-[2.5rem] p-4 space-y-3 border-2 transition-all duration-200 ${isOver ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/10 scale-[1.01]" : "border-transparent bg-slate-50/80 dark:bg-[#1C1C1E]/60 border-slate-100 dark:border-[#2C2C2E]"}`}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <div className={`h-32 flex items-center justify-center rounded-[2rem] border-2 border-dashed transition-all ${isOver ? "border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-[#2C2C2E]"}`}>
              <p className="text-[11px] text-slate-400 dark:text-[#52525B] font-medium">{col.emptyText}</p>
            </div>
          )}
          {items.map((r) => <AdminRedacaoCard key={r.id} redacao={r} col={col} onOpenCorrecao={onOpenCorrecao} />)}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────
export default function AdminRedacaoPanel() {
  const [activeTab, setActiveTab] = useState<'temas' | 'correcao'>('temas');
  const supabase = createClient();
  
  // Data States
  const [temas, setTemas] = useState<TemaProposta[]>([]);
  const [redacoes, setRedacoes] = useState<RedacaoGlobal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Tema Form State
  const [temaForm, setTemaForm] = useState({ titulo: "", tema: "" });

  // Correcao Modal State
  const [activeCorrecao, setActiveCorrecao] = useState<RedacaoGlobal | null>(null);
  const [correcaoForm, setCorrecaoForm] = useState({ nota: "", feedback: "", arquivos: [] as string[] });

  // DB Sync helper
  const mapStatusFront = (dbStatus: string): AdminStatus => {
     if(dbStatus === 'EM_AVALIACAO') return 'avaliando';
     if(dbStatus === 'DEVOLVIDA') return 'corrigida';
     return 'enviada';
  }
  const mapStatusDb = (frontendStatus: string): string => {
     if(frontendStatus === 'avaliando') return 'EM_AVALIACAO';
     if(frontendStatus === 'corrigida') return 'DEVOLVIDA';
     return 'A_FAZER';
  }

  // Boot
  useEffect(() => {
    const fetchSupabase = async () => {
      // 1. Fetch Temas
      const { data: dtTemas } = await supabase.from('temas_redacao').select('*').order('created_at', { ascending: false });
      if(dtTemas) {
         setTemas(dtTemas.map(t => ({
            id: t.id,
            titulo: t.titulo,
            tema: t.descricao_html || t.eixo_tematico || '',
            dataCriacao: t.created_at
         })));
      }

      // 2. Fetch Redações Plenas
      const { data: dtRedacoes } = await supabase.from('redacoes_aluno').select(`
         id, status, pdf_url, nota, feedback_admin, created_at,
         profiles (nome),
         temas_redacao (titulo)
      `).order('created_at', { ascending: false });

      if(dtRedacoes) {
         setRedacoes(dtRedacoes.map(r => ({
            id: r.id,
            // @ts-ignore
            studentName: r.profiles?.nome || 'Aluno Desconhecido',
            // @ts-ignore
            titulo: r.temas_redacao?.titulo || 'Redação Enviada',
            tema: 'Tema Oficial',
            dataCriacao: r.created_at,
            status: mapStatusFront(r.status),
            imagens: r.pdf_url ? [r.pdf_url] : [],
            respostaAdmin: r.nota ? { nota: r.nota, feedback: r.feedback_admin || '', arquivos: [] } : undefined
         })));
      }
      setIsLoaded(true);
    };

    fetchSupabase();
  }, []);

  // --- Temas Handlers ---
  const handleSaveTema = async () => {
     if(!temaForm.titulo.trim() || !temaForm.tema.trim()) return;

     const { data: { user } } = await supabase.auth.getUser();
     const newRow = {
         admin_id: user?.id || null,
         titulo: temaForm.titulo,
         descricao_html: temaForm.tema,
         is_published: true
     };

     const { data, error } = await supabase.from('temas_redacao').insert([newRow]).select().single();
     if(data && !error) {
         const newTema = {
            id: data.id, titulo: data.titulo, tema: data.descricao_html || '', dataCriacao: data.created_at
         };
         setTemas([newTema, ...temas]);
     }
     setTemaForm({ titulo: "", tema: "" });
  };

  const handleDeleteTema = async (id: string) => {
     await supabase.from('temas_redacao').delete().eq('id', id);
     setTemas(temas.filter(t => t.id !== id));
  };


  // --- Kanban Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const [dragActiveId, setDragActiveId] = useState<string | null>(null);

  const handleDragStart = (e: DragStartEvent) => setDragActiveId(e.active.id.toString());

  const handleDragEnd = async (event: DragEndEvent) => {
    setDragActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id.toString();
    const overId = over.id.toString();

    let updatedList = [...redacoes];
    let newStatus: AdminStatus | null = null;

    if (COLUMNS.find((c) => c.id === overId)) {
      newStatus = overId as AdminStatus;
      updatedList = updatedList.map((r) => (r.id === draggedId ? { ...r, status: newStatus as AdminStatus } : r));
    } else {
      const draggedItem = updatedList.find((r) => r.id === draggedId);
      const overItem = updatedList.find((r) => r.id === overId);
      if (!draggedItem || !overItem) return;

      if (draggedItem.status === overItem.status) {
        const filtered = updatedList.filter((r) => r.status === draggedItem.status);
        const oldIdx = filtered.findIndex((r) => r.id === draggedId);
        const newIdx = filtered.findIndex((r) => r.id === overId);
        const reordered = arrayMove(filtered, oldIdx, newIdx);
        updatedList = [...updatedList.filter((r) => r.status !== draggedItem.status), ...reordered];
      } else {
        newStatus = overItem.status as AdminStatus;
        updatedList = updatedList.map((r) => (r.id === draggedId ? { ...r, status: overItem.status as AdminStatus } : r));
      }
    }

    setRedacoes(updatedList);
    // Persist to DB
    if(newStatus) {
       await supabase.from('redacoes_aluno').update({ status: mapStatusDb(newStatus) }).eq('id', draggedId);
    }
  };

  // --- Correção Handlers ---
  const handleOpenCorrecao = (redacao: RedacaoGlobal) => {
     setActiveCorrecao(redacao);
     if(redacao.respostaAdmin) {
        setCorrecaoForm({ 
            nota: redacao.respostaAdmin.nota.toString(), 
            feedback: redacao.respostaAdmin.feedback,
            arquivos: redacao.respostaAdmin.arquivos || []
        });
     } else {
        setCorrecaoForm({ nota: "", feedback: "", arquivos: [] });
     }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCorrecaoForm(prev => ({ ...prev, arquivos: [...prev.arquivos, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
     setCorrecaoForm(prev => ({ ...prev, arquivos: prev.arquivos.filter((_, i) => i !== index) }));
  }

  const handleDevolver = async () => {
     if(!activeCorrecao) return;
     const score = parseInt(correcaoForm.nota);
     if(isNaN(score)) return alert("Preencha uma nota válida!");

     // Sync with Supabase (ignoring attachments upload to buckets for this stage, focusing on metadata limits)
     await supabase.from('redacoes_aluno').update({
         status: 'DEVOLVIDA',
         nota: score,
         feedback_admin: correcaoForm.feedback
     }).eq('id', activeCorrecao.id);

     const finalRed = {
         ...activeCorrecao,
         status: "corrigida" as AdminStatus,
         respostaAdmin: {
             nota: score,
             feedback: correcaoForm.feedback,
             arquivos: correcaoForm.arquivos
         }
     };

     const updatedList = redacoes.map(r => r.id === finalRed.id ? finalRed : r);
     setRedacoes(updatedList);
     setActiveCorrecao(null);
  };

  if(!isLoaded) return null;

  return (
    <div className="max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-500 space-y-10 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <PenTool className="w-8 h-8 text-white" />
            </div>
            Central de Redação
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-2 font-medium text-lg">Proponha temas e lance notas com avaliações diretas do Banco.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-[#1C1C1E] p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-[#2C2C2E]">
            <button 
              onClick={() => setActiveTab('temas')}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'temas' ? 'bg-white dark:bg-[#2C2C2E] shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
            >
              <Lightbulb className="w-4 h-4" /> Temas Oficiais
            </button>
            <button 
              onClick={() => setActiveTab('correcao')}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'correcao' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400'}`}
            >
              <ClipboardCheck className="w-4 h-4" /> Mesa de Correção
            </button>
        </div>
      </header>

      {/* VIEW: TEMAS */}
      {activeTab === 'temas' && (
         <div className="grid lg:grid-cols-[1fr_2fr] gap-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Lançamento Formulário */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] h-max sticky top-8">
               <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-500"/> Lançar Proposta</h2>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Título da Proposta</label>
                     <input 
                        value={temaForm.titulo} onChange={e => setTemaForm({...temaForm, titulo: e.target.value})}
                        type="text" className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="Ex: Impactos da IA..." 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Texto Motivador (Descrição)</label>
                     <textarea 
                        value={temaForm.tema} onChange={e => setTemaForm({...temaForm, tema: e.target.value})}
                        rows={6} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none resize-none" placeholder="Escreva o contexto da proposta..." 
                     />
                  </div>
                  <button onClick={handleSaveTema} className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-xs">
                     Publicar Tema Oficial
                  </button>
               </div>
            </div>

            {/* Listagem Global */}
            <div className="grid sm:grid-cols-2 gap-5 content-start">
               {temas.length === 0 && (
                  <div className="sm:col-span-2 py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-[#2C2C2E] rounded-[3rem]">
                     <Lightbulb className="w-12 h-12 text-slate-300 dark:text-[#3A3A3C] mb-4" />
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Nenhum tema criado no Banco.</p>
                  </div>
               )}
               {temas.map(t => (
                  <div key={t.id} className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Star className="w-3 h-3 fill-current" /> Oficial</div>
                        <button onClick={() => handleDeleteTema(t.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"><Trash2 className="w-4 h-4"/></button>
                     </div>
                     <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight mb-2">{t.titulo}</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed mb-6">{t.tema}</p>
                     
                     <div className="mt-auto border-t border-slate-100 dark:border-[#2C2C2E] pt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                        <Calendar className="w-3.5 h-3.5" /> Criado em {formatDate(new Date(t.dataCriacao), "dd/MM/yyyy")}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* VIEW: MESA DE CORREÇÃO (KANBAN) */}
      {activeTab === 'correcao' && (
         <div className="animate-in slide-in-from-bottom-4 duration-500">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id} col={col}
                    items={redacoes.filter((r) => r.status === col.id)}
                    onOpenCorrecao={handleOpenCorrecao}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={{ duration: 200 }}>
                 {dragActiveId ? (
                     <div className="bg-white p-5 rounded-[1.5rem] border border-indigo-300 shadow-2xl rotate-3 min-w-[280px]">
                        <h3 className="font-bold text-slate-800 text-sm">{redacoes.find(x => x.id === dragActiveId)?.titulo}</h3>
                     </div>
                 ) : null}
              </DragOverlay>
            </DndContext>
         </div>
      )}

      {/* MODAL: CORREÇÃO E FEEDBACK */}
      <AnimatePresence>
         {activeCorrecao && (
            <motion.div
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
            >
               <motion.div
                  initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh]"
               >
                  {/* ESQUERDA: VISUALIZADOR DA SUBMISSÃO */}
                  <div className="md:w-1/2 p-8 bg-slate-50 dark:bg-[#121212] overflow-y-auto hidden-scrollbar flex flex-col">
                     <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2">Envio do Estudante</h4>
                     <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{activeCorrecao.titulo}</h2>
                     <p className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2"><User className="w-4 h-4"/> Autor: {activeCorrecao.studentName}</p>
                     
                     <div className="space-y-4 flex-1">
                        {activeCorrecao.imagens && activeCorrecao.imagens.map((img, i) => (
                           <a key={i} href={img} target="_blank" rel="noreferrer" className="block w-full border-2 border-slate-200 dark:border-[#2C2C2E] p-2 bg-white dark:bg-[#1C1C1E] rounded-3xl hover:border-indigo-400 transition-colors shadow-sm">
                              <img src={img} className="w-full object-contain rounded-2xl" alt={`Página ${i+1}`} />
                           </a>
                        ))}
                        {(!activeCorrecao.imagens || activeCorrecao.imagens.length === 0) && (
                           <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] p-6 rounded-3xl text-center">
                              <p className="text-slate-400 text-sm font-bold">Nenhuma imagem enviada pelo aluno.</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* DIREITA: ÁREA DO CORRETOR */}
                  <div className="md:w-1/2 p-8 flex flex-col relative overflow-y-auto hidden-scrollbar">
                     <button onClick={() => setActiveCorrecao(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                     </button>
                     
                     <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-8"><Award className="w-6 h-6 text-teal-500" /> Dar Parecer (Correção)</h3>

                     <div className="space-y-6 flex-1">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">Nota ENEM Formato</label>
                           <input 
                              type="number" min="0" max="1000" step="20" placeholder="Ex: 960" value={correcaoForm.nota} onChange={e => setCorrecaoForm({...correcaoForm, nota: e.target.value})}
                              className="w-32 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] text-2xl font-black text-slate-800 dark:text-white px-4 py-3 rounded-2xl focus:ring-4 focus:ring-teal-100 outline-none text-center appearance-none"
                           />
                        </div>

                        <div>
                           <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 flex items-center gap-2">
                              <MessageCircle className="w-3.5 h-3.5" /> Feedback Descritivo
                           </label>
                           <textarea 
                              value={correcaoForm.feedback} onChange={e => setCorrecaoForm({...correcaoForm, feedback: e.target.value})}
                              rows={5} placeholder="Deixe um comentário encorajador sobre os pontos positivos e os desvios cometidos..."
                              className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-teal-100 outline-none resize-none"
                           />
                        </div>

                        <div>
                           <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                              <ClipboardCheck className="w-3.5 h-3.5" /> Anexos da Correção (Opcional)
                           </label>
                           <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                              <label className="w-24 h-24 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#3A3A3C] rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-all group">
                                 <Plus className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-1" />
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adicionar</span>
                                 <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileAttach} />
                              </label>

                              {correcaoForm.arquivos.map((file, idx) => (
                                 <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-2xl border border-slate-200 overflow-hidden group">
                                 <img src={file} alt="Anexo de correção" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                       type="button"
                                       onClick={() => removeFile(idx)}
                                       className="bg-white/20 p-2 rounded-full hover:bg-rose-500 text-white transition-colors"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <button onClick={handleDevolver} className="w-full mt-6 bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm tracking-widest uppercase">
                        <CheckCircle2 className="w-5 h-5"/> Salvar no Banco
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
