"use client";

import React, { useState, useEffect } from "react";
import {
  PenTool, Plus, Trash2, ArrowRight,
  Lightbulb, FileText, ClipboardCheck, Award, Activity,
  X, Star, Calendar, GripVertical, Edit2, Clock, CheckCircle2, MessageCircle, FileImage, User
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
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ComposedChart, Line, Legend, Bar 
} from "recharts";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { createClient } from "@/utils/supabase/client";

type StudentKanbanStatus = "enviada" | "corrigida";

interface RespostaAdmin {
   feedback: string;
   nota: number;
   arquivos: string[];
}

interface RedacaoGlobal {
  id: string;
  studentId: string;
  studentName: string;
  temaId?: string;
  titulo: string;
  tema: string;
  dataCriacao: string;
  status: StudentKanbanStatus | "avaliando";
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

// Student columns
const COLUMNS: {
  id: StudentKanbanStatus | "avaliando";
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
    label: "Aguardando Correção",
    icon: ClipboardCheck,
    accent: "text-amber-500",
    dot: "bg-amber-500",
    card: "hover:border-amber-200 dark:hover:border-amber-900/60",
    badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    emptyText: "Você não tem envios aguardando.",
  },
  {
    id: "corrigida",
    label: "Corrigida",
    icon: Award,
    accent: "text-teal-500",
    dot: "bg-teal-500",
    card: "hover:border-teal-200 dark:hover:border-teal-900/60",
    badge: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
    emptyText: "As correções aparecerão aqui.",
  },
];

// ─── CARD COMPONENTE ───────────────────────────────────────────────────────
function RedacaoCard({
  redacao,
  col,
  onDelete,
  onEdit,
  onSalvarTempo,
  onVerCorrecao
}: {
  redacao: RedacaoGlobal;
  col: typeof COLUMNS[number];
  onDelete: (id: string, e: any) => void;
  onEdit: (id: string) => void;
  onSalvarTempo: (id: string, tempo: number | null) => void;
  onVerCorrecao: (r: RedacaoGlobal) => void;
}) {
  const [editingTime, setEditingTime] = useState(false);
  const [tempH, setTempH] = useState(Math.floor((redacao.tempoMinutos || 0) / 60).toString());
  const [tempM, setTempM] = useState(((redacao.tempoMinutos || 0) % 60).toString());

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: redacao.id, data: { status: redacao.status } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  const saveTime = (e: any) => {
    e.stopPropagation();
    const finalMinutos = (parseInt(tempH) || 0) * 60 + (parseInt(tempM) || 0);
    onSalvarTempo(redacao.id, finalMinutos > 0 ? finalMinutos : null);
    setEditingTime(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`group bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm transition-all ${col.card} ${isDragging ? "shadow-xl ring-2 ring-indigo-400/40" : ""}`}>
        <div className="flex items-start gap-2">
          
          <div className="flex-1 min-w-0">
            {redacao.imagens && redacao.imagens.length > 0 && (
              <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar mb-4">
                {redacao.imagens.slice(0, 3).map((img, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 dark:border-[#2C2C2E] flex-shrink-0">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ))}
                {redacao.imagens.length > 3 && (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center text-[10px] font-black text-slate-500">
                    +{redacao.imagens.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">
                {redacao.titulo}
              </h3>
              
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => onDelete(redacao.id, e)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {redacao.tema && (
              <p className="text-[11px] text-slate-400 dark:text-[#71717A] leading-relaxed line-clamp-2 mb-4">
                {redacao.tema}
              </p>
            )}

            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 dark:text-[#52525B] font-bold uppercase">
                  <Calendar className="w-3 h-3" />
                  {new Date(redacao.dataCriacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </div>
                {redacao.status === "avaliando" && (
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">O Corretor começou avaliar!</span>
                )}
                
              </div>

              {/* Botões de Ação na Direita */}
              <div className="flex items-center gap-2">
                 {col.id === "corrigida" && redacao.respostaAdmin && (
                    <>
                       <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-black text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" /> {redacao.respostaAdmin.nota}
                       </span>
                       <button onClick={() => onVerCorrecao(redacao)} className={`opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black uppercase px-2 py-1 rounded-lg ${col.badge} hover:brightness-95 ml-2`}>Ver Correção</button>
                    </>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COLUNA DROPPABLE ──────────────────────────────────────────────────────
function KanbanColumn({ col, items, onDelete, onEdit, onSalvarTempo, onVerCorrecao }: {
  col: typeof COLUMNS[number]; items: RedacaoGlobal[];
  onDelete: (id: string, e: any) => void; onEdit: (id: string) => void;
  onSalvarTempo: (id: string, tempo: number | null) => void;
  onVerCorrecao: (r: RedacaoGlobal) => void;
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
          {items.map((redacao) => (
            <RedacaoCard key={redacao.id} redacao={redacao} col={col} onDelete={onDelete} onEdit={onEdit} onSalvarTempo={onSalvarTempo} onVerCorrecao={onVerCorrecao}/>
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── TEMA ITEM (PROPOSTAS OFICIAIS) ──────────────────────────────────────────
function TemaItem({ tema, onStartTema }: { tema: TemaProposta; onStartTema: (t: TemaProposta) => void }) {
   return (
      <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm hover:border-indigo-200 transition-colors flex flex-col group">
         <div className="flex items-center gap-2 mb-3">
            <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Star className="w-3 h-3 fill-current" /> Oficial</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase ml-auto">{formatDate(new Date(tema.dataCriacao), "dd/MMM", {locale:ptBR})}</span>
         </div>
         <h3 className="font-black text-slate-800 dark:text-white text-sm mb-2">{tema.titulo}</h3>
         <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">{tema.tema}</p>
         
         <button onClick={() => onStartTema(tema)} className="mt-auto w-full py-2.5 bg-slate-50 hover:bg-indigo-600 dark:bg-[#2C2C2E] dark:hover:bg-indigo-600 text-slate-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            Fazer Redação do Tema
         </button>
      </div>
   );
}


// ─── PAGE ──────────────────────────────────────────────────────────────────
export default function RedacaoPage() {
  const [redacoes, setRedacoes] = useState<RedacaoGlobal[]>([]);
  const [temasOficiais, setTemasOficiais] = useState<TemaProposta[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  // Modal Novo / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ 
     temaId: "", 
     titulo: "", 
     tema: "", 
     imagens: [] as string[], 
     tempoH: "", 
     tempoM: "" 
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Correção Preview Viewer Modal
  const [viewingCorrecao, setViewingCorrecao] = useState<RedacaoGlobal|null>(null);

  const mapStatusFront = (dbStatus: string): StudentKanbanStatus | 'avaliando' => {
     if (dbStatus === 'EM_AVALIACAO') return 'avaliando';
     if (dbStatus === 'DEVOLVIDA') return 'corrigida';
     return 'enviada';
  };

  useEffect(() => {
    const fetchData = async () => {
      // Temas
      const { data: dtTemas } = await supabase.from('temas_redacao').select('*').eq('is_published', true).order('created_at', { ascending: false });
      if(dtTemas) {
         setTemasOficiais(dtTemas.map(t => ({ id: t.id, titulo: t.titulo, tema: t.descricao_html || t.eixo_tematico || '', dataCriacao: t.created_at })));
      }

      // Sessão
      const { data: { user } } = await supabase.auth.getUser();
      const me = user?.id;

      if(me) {
         // Redações
         const { data: dtRedacoes } = await supabase.from('redacoes_aluno').select(`
            id, status, pdf_url, nota, feedback_admin, created_at,
            profiles (nome),
            temas_redacao (titulo, descricao_html)
         `).eq('aluno_id', me).order('created_at', { ascending: false });

         if(dtRedacoes) {
            setRedacoes(dtRedacoes.map(r => ({
               id: r.id,
               studentId: me,
               // @ts-ignore
               studentName: r.profiles?.nome || 'Eu',
               // @ts-ignore
               titulo: r.temas_redacao?.titulo || 'Minha Redação',
               // @ts-ignore
               tema: r.temas_redacao?.descricao_html || '',
               dataCriacao: r.created_at,
               status: mapStatusFront(r.status),
               imagens: r.pdf_url ? [r.pdf_url] : [],
               respostaAdmin: r.nota ? { nota: r.nota, feedback: r.feedback_admin || '', arquivos: [] } : undefined
            })));
         }
      }
      setIsLoaded(true);
    };

    fetchData();
  }, []);

  const openNew = () => {
     setForm({ temaId: "", titulo: "", tema: "", imagens: [], tempoH: "", tempoM: "" });
     setEditingId(null);
     setIsModalOpen(true);
  };

  const openTema = (t: TemaProposta) => {
     setForm({ temaId: t.id, titulo: t.titulo, tema: t.tema, imagens: [], tempoH: "", tempoM: "" });
     setEditingId(null);
     setIsModalOpen(true);
  }

  const saveRedacao = async () => {
    if (!form.titulo.trim()) return;
    
    let finalTemaId = form.temaId;
    const { data: {user} } = await supabase.auth.getUser();

    // Se n tem tema_id, Cria na hora no banco um placeholder (Tema Livre)
    if(!finalTemaId) {
        const { data: newTema } = await supabase.from('temas_redacao').insert([{
           admin_id: user?.id,
           titulo: form.titulo,
           descricao_html: form.tema,
           is_published: false
        }]).select().single();
        if(newTema) finalTemaId = newTema.id;
    }

    const { data: rAl } = await supabase.from('redacoes_aluno').insert([{
       aluno_id: user?.id,
       tema_id: finalTemaId,
       pdf_url: form.imagens[0] || null, // Apenas simulando 1 única imagem pro DB string field
       status: 'A_FAZER'
    }]).select().single();

    if(rAl) {
       const nova: RedacaoGlobal = {
         id: rAl.id, studentId: user?.id || '', studentName: 'Eu',
         titulo: form.titulo, tema: form.tema, dataCriacao: rAl.created_at, status: "enviada",
         imagens: form.imagens
       };
       setRedacoes([nova, ...redacoes]);
    }

    setForm({ temaId: "", titulo: "", tema: "", imagens: [], tempoH: "", tempoM: "" });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imagens: [...prev.imagens, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteRedacao = async (id: string, e: any) => {
    if(e) e.stopPropagation();
    await supabase.from('redacoes_aluno').delete().eq('id', id);
    setRedacoes(redacoes.filter((r) => r.id !== id));
  };
  

  if (!isLoaded) return null;

  const corrigidas = redacoes.filter((r) => r.status === "corrigida" && r.respostaAdmin?.nota != null);
  const mediaNotas = corrigidas.length > 0 ? Math.round(corrigidas.reduce((a, b) => a + (b.respostaAdmin?.nota || 0), 0) / corrigidas.length) : null;
  const dChart = redacoes.filter(r => r.respostaAdmin?.nota || r.tempoMinutos).map(r => ({
      name: r.titulo,
      nota: r.respostaAdmin?.nota || 0,
      tempo: r.tempoMinutos || 0,
      date: formatDate(new Date(r.dataCriacao), "dd/MM", { locale: ptBR })
  })).slice(-10);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-500 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4 relative z-10">
            <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
              <PenTool className="w-8 h-8 text-white" />
            </div>
            Minha Bancada
          </h1>
          <div className="flex items-center gap-3 mt-3 relative z-10">
             <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em]">Asas para o Enem! Acompanhe suas notas.</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-black px-7 py-4 rounded-2xl shadow-xl shadow-indigo-500/20 text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5" /> Nova Redação (Tema Livre)
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
          { label: "Total Feitas", value: redacoes.length, accent: "text-slate-700 dark:text-white" },
          { label: "Aguardando Correção", value: redacoes.filter((r) => r.status === "enviada" || r.status === "avaliando").length, accent: "text-indigo-600 dark:text-indigo-400" },
          { label: "Corrigidas", value: corrigidas.length, accent: "text-teal-600 dark:text-teal-400" },
          { label: "Nota média", value: mediaNotas ? `${mediaNotas}/1000` : "—", accent: "text-amber-600 dark:text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#1C1C1E] rounded-2xl px-6 py-4 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <DndContext sensors={[]}>
         <div className="grid lg:grid-cols-[1fr_2fr] gap-6 items-start">
            
            {/* Esquerda: Banco de Temas */}
            <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[2.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col h-[70vh] overflow-hidden">
               <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 flex items-center justify-center"><Lightbulb className="w-5 h-5" /></div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">Propostas Oficiais</h2>
               </div>
               
               <div className="flex-1 overflow-y-auto hidden-scrollbar space-y-4 px-2 pb-10">
                  {temasOficiais.length === 0 && (
                     <div className="text-center py-10 opacity-60">
                        <p className="text-slate-400 text-sm font-bold">Nenhum tema oficial disponibilizado.</p>
                     </div>
                  )}
                  {temasOficiais.map(t => <TemaItem key={t.id} tema={t} onStartTema={openTema}/>)}
               </div>
            </div>

            {/* Direita: Kanban Aluno */}
            <div className="grid md:grid-cols-2 gap-6">
               {COLUMNS.map((col) => (
                  <KanbanColumn key={col.id} col={col} items={redacoes.filter(r => r.status === col.id || (col.id === 'enviada' && r.status === 'avaliando'))} onDelete={deleteRedacao} onEdit={()=>{}} onSalvarTempo={()=>{}} onVerCorrecao={setViewingCorrecao} />
               ))}
            </div>

         </div>
      </DndContext>

      {/* Gráfico */}
      {corrigidas.length > 0 && (
         <section className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] mt-10">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-8"><Activity className="w-7 h-7 text-indigo-500" />Evolução das Notas (Base Oficial Enem)</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={dChart} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                     <linearGradient id="nGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                  <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6366f1', fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }} />
                  <Line type="monotone" dataKey="nota" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} name="Nota Final" />
               </ComposedChart>
               </ResponsiveContainer>
            </div>
         </section>
      )}

      {/* MODAL CRIAR AVALIAÇÃO ONDE ANEXA ARQUIVO */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto hidden-scrollbar border border-slate-100 dark:border-[#2C2C2E]">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:bg-slate-100 rounded-full dark:hover:bg-[#2C2C2E] transition-colors"><X className="w-5 h-5" /></button>
              
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Enviar Redação para Correção</h2>
              <p className="text-sm text-slate-400 mb-8">Ela será inserida no painel direto do corretor com seus anexos.</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Título</label>
                  <input type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" placeholder="Título da Rascunho"/>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{form.temaId ? 'Tema Selecionado' : 'Tema Livre'}</label>
                  <textarea rows={4} disabled={!!form.temaId} value={form.tema} onChange={e => setForm({...form, tema: e.target.value})} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 outline-none resize-none transition-all" placeholder="Descreva brevemente o tema proposto..."/>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anexar Folhas Manuscritas</label>
                  <div className="grid grid-cols-4 gap-4">
                    <label className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-[#3A3A3C] rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] transition-all group">
                      <Plus className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-1" />
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleImageUpload} />
                    </label>
                    {form.imagens.map((img, i) => (
                       <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={img} alt={`Anexo ${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => setForm(f => ({...f, imagens: f.imagens.filter((_, idx)=>idx !== i)}))} className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveRedacao} className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2 mt-4">
                  Enviar para a Mesa de Correção <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK VIEWER (Aluno olhando a redação devolvida) */}
      <AnimatePresence>
         {viewingCorrecao && viewingCorrecao.respostaAdmin && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row overflow-hidden border border-slate-100 dark:border-[#2C2C2E] max-h-[90vh]">
                  {/* Text e Nota */}
                  <div className="md:w-full p-10 flex flex-col relative bg-white dark:bg-[#1C1C1E]">
                     <button onClick={() => setViewingCorrecao(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                     </button>
                     <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-10 pr-10 leading-snug">{viewingCorrecao.titulo}</h2>
                     
                     <div className="mb-10 w-max border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/10 rounded-[2rem] px-8 py-5 flex items-center gap-4">
                        <Award className="w-10 h-10 text-teal-500" />
                        <div>
                           <p className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-widest leading-none mb-1">Nota Final (Enem)</p>
                           <p className="text-4xl font-black text-teal-600 dark:text-teal-400 leading-none">{viewingCorrecao.respostaAdmin.nota}</p>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5"/> Parecer do Professor</h4>
                        <div className="bg-slate-50 dark:bg-[#2C2C2E] p-6 rounded-[2rem] border border-slate-100 dark:border-[#3A3A3C]">
                           <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                              {viewingCorrecao.respostaAdmin.feedback || "O corretor não deixou um comentário adicional."}
                           </p>
                        </div>
                     </div>

                     <button onClick={() => setViewingCorrecao(null)} className="mt-auto pt-6 w-full bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-slate-800 dark:text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-sm">
                        Fechar Avaliação
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
