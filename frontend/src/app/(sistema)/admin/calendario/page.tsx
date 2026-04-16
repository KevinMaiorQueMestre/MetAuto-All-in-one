"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { 
  format, addDays, startOfWeek, subWeeks, addWeeks, 
  parseISO, startOfMonth, endOfMonth, eachDayOfInterval, 
  endOfWeek, subMonths, addMonths, isSameMonth, isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2, Edit2, Globe, Lock, Save, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// --- Types ---
type AppEvent = {
  id: string;
  title: string;
  dateIso: string; 
  timeSlot: string;
  colorClass: string;
  textClass: string;
  description?: string;
  isPublic?: boolean;
};

const HOURS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const TODAY = new Date();

// --- DnD Components ---
function DraggableEvent({ event, onClick }: { event: AppEvent; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: event,
  });
  
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      className={`absolute inset-[3px] rounded-xl p-2 cursor-grab active:cursor-grabbing transition-colors overflow-hidden border ${event.colorClass} ${event.isPublic ? 'border-indigo-400 dark:border-indigo-500 shadow-indigo-100' : 'border-slate-300 dark:border-slate-600'}`}
    >
      <div className={`text-[10px] sm:text-[11px] leading-tight font-bold flex flex-col h-full justify-between ${event.textClass}`}>
        <span>{event.title}</span>
        <div className="flex justify-end">
           {event.isPublic ? <Globe className="w-2.5 h-2.5 opacity-60" /> : <Lock className="w-2.5 h-2.5 opacity-40" />}
        </div>
      </div>
    </div>
  );
}

function DroppableSlot({ id, children, onClick }: { id: string; children: React.ReactNode; onClick?: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`border-r border-b border-slate-100 dark:border-[#2C2C2E] min-h-[70px] relative transition-colors cursor-pointer group hover:bg-slate-50 dark:hover:bg-[#2C2C2E] ${
        isOver ? "bg-indigo-50 dark:bg-indigo-900/30 outline outline-2 outline-indigo-300 z-10" : ""
      }`}
    >
      {!React.Children.count(children) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Plus className="w-5 h-5 text-slate-300" />
        </div>
      )}
      {children}
    </div>
  );
}

export default function AdminCalendarioPage() {
  const [activeTab, setActiveTab] = useState<'rascunhos' | 'publicados'>('rascunhos');
  const [events, setEvents] = useState<AppEvent[]>([]);
  const supabase = createClient();
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Temporal States
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(TODAY, { weekStartsOn: 1 }));
  const [currentMonthNode, setCurrentMonthNode] = useState(() => startOfMonth(TODAY));

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newEventSlot, setNewEventSlot] = useState<{ dateIso: string; timeSlot: string } | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [isPublicMarked, setIsPublicMarked] = useState(false);
  const [newEventColor, setNewEventColor] = useState("bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 text-indigo-800");
  const [viewEvent, setViewEvent] = useState<AppEvent | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (user) {
         // O Admin carrega eventos admin (rascunhos e publicos dele/do sistema)
         const { data, error } = await supabase
            .from('calendario_eventos')
            .select('*')
            .eq('tipo', 'aviso_admin'); // Apenas tipo admin para a painel do gestor
         
         if (data && !error) {
            const mapped: AppEvent[] = data.map(evt => ({
               id: evt.id,
               title: evt.titulo,
               dateIso: evt.date_iso,
               timeSlot: evt.time_slot,
               colorClass: evt.color_class.split('|')[0] || "bg-indigo-100", // color text pack trick
               textClass: evt.color_class.split('|')[1] || "text-indigo-800",
               description: evt.descricao,
               isPublic: evt.is_published
            }));
            setEvents(mapped);
         }
      }
      setIsLoaded(true);
    };
    fetchEvents();
  }, []);

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  const calendarDays = eachDayOfInterval({ 
    start: startOfWeek(startOfMonth(currentMonthNode), { weekStartsOn: 1 }), 
    end: endOfWeek(endOfMonth(currentMonthNode), { weekStartsOn: 1 }) 
  });

  const displayedEvents = events.filter(e => activeTab === 'publicados' ? e.isPublic : !e.isPublic);

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const [dateIso, timeSlot] = over.id.toString().split("|");
    const activeIdStr = active.id.toString();
    
    // Update local state for immediate feedback
    const updated = events.map(ev => ev.id === activeIdStr ? { ...ev, dateIso, timeSlot } : ev);
    setEvents(updated);
    
    // Update DB
    await supabase.from('calendario_eventos').update({
       date_iso: dateIso,
       time_slot: timeSlot
    }).eq('id', activeIdStr);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventSlot || !newEventTitle.trim()) return;

    const baseColor = newEventColor.split(' text-')[0] || newEventColor;
    const baseText = newEventColor.includes(' text-') ? 'text-' + newEventColor.split(' text-')[1] : 'text-slate-800';

    const payload = {
       user_id: userId,
       titulo: newEventTitle,
       date_iso: newEventSlot.dateIso,
       time_slot: newEventSlot.timeSlot,
       color_class: `${baseColor}|${baseText}`,
       descricao: newEventDesc,
       tipo: 'aviso_admin',
       is_published: isPublicMarked
    };

    if (editEventId) {
      const { data } = await supabase.from('calendario_eventos').update(payload).eq('id', editEventId).select().single();
      if(data) {
         setEvents(events.map(ev => ev.id === editEventId ? {
            id: data.id, title: data.titulo, dateIso: data.date_iso, timeSlot: data.time_slot,
            colorClass: baseColor, textClass: baseText, description: data.descricao, isPublic: data.is_published
         } : ev));
      }
    } else {
      const { data } = await supabase.from('calendario_eventos').insert([payload]).select().single();
      if(data) {
         setEvents([...events, {
            id: data.id, title: data.titulo, dateIso: data.date_iso, timeSlot: data.time_slot,
            colorClass: baseColor, textClass: baseText, description: data.descricao, isPublic: data.is_published
         }]);
      }
    }

    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditEventId(null);
    setNewEventTitle("");
    setNewEventDesc("");
    setIsPublicMarked(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('calendario_eventos').delete().eq('id', id);
    setEvents(events.filter(e => e.id !== id));
    setViewEvent(null);
  };

  if(!isLoaded) return null;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            Gestão de Eventos
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-2 font-medium text-lg">Área de rascunhos e comunicados oficiais do seu Curso.</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-[#1C1C1E] p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-[#2C2C2E]">
            <button 
              onClick={() => setActiveTab('rascunhos')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'rascunhos' ? 'bg-white dark:bg-[#2C2C2E] shadow-md text-indigo-600' : 'text-slate-400'}`}
            >
              <Lock className="w-4 h-4" /> Rascunhos
            </button>
            <button 
              onClick={() => setActiveTab('publicados')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'publicados' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400'}`}
            >
              <Globe className="w-4 h-4" /> Públicos globais
            </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LADO ESQUERDO: Mini Calendário */}
        <aside className="w-full lg:w-[320px] space-y-6">
           <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
              <div className="flex justify-between items-center mb-6 px-2">
                <button onClick={() => setCurrentMonthNode(subMonths(currentMonthNode, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white">{format(currentMonthNode, "MMMM yyyy", { locale: ptBR })}</h3>
                <button onClick={() => setCurrentMonthNode(addMonths(currentMonthNode, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((d, i) => (
                  <div 
                    key={i} 
                    onClick={() => setCurrentWeekStart(startOfWeek(d, { weekStartsOn: 1 }))}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold cursor-pointer transition-all ${isSameDay(d, TODAY) ? 'bg-indigo-600 text-white shadow-lg' : isSameMonth(d, currentMonthNode) ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-50' : 'text-slate-300 dark:text-slate-700'}`}
                  >
                    {format(d, "d")}
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2.5rem] p-8 border border-indigo-100 dark:border-indigo-900/20 relative overflow-hidden">
              <Globe className="absolute -right-6 -bottom-6 w-32 h-32 text-indigo-500/10" />
              <div className="relative z-10">
                <h4 className="font-black text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Dica Admin</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
                  Eventos marcados como **Públicos globais** aparecem instantaneamente na Home e no Calendário de todos os alunos do sistema.
                </p>
              </div>
           </div>
        </aside>

        {/* LADO DIREITO: GRID INTERATIVO */}
        <main className="flex-1 bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col overflow-hidden min-h-[800px]">
           <div className="px-8 py-6 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/30 dark:bg-[#1C1C1E]">
              <div className="flex items-center gap-4 bg-white dark:bg-[#2C2C2E] p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3A3A3C]">
                 <button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="p-2 hover:bg-slate-50 rounded-xl"><ChevronLeft className="w-4 h-4" /></button>
                 <span className="text-xs font-black text-slate-800 dark:text-white px-2">
                   {format(weekDays[0], "dd/MM")} - {format(weekDays[6], "dd/MM")}
                 </span>
                 <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="p-2 hover:bg-slate-50 rounded-xl"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <button 
                onClick={() => { resetForm(); setNewEventSlot({ dateIso: format(TODAY, "yyyy-MM-dd"), timeSlot: "09:00" }); setModalOpen(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Novo Lançamento
              </button>
           </div>

           <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                  {/* Header Dias */}
                  <div className="h-14 border-b border-r border-slate-100 dark:border-[#2C2C2E]"></div>
                  {weekDays.map((d, i) => (
                    <div key={i} className={`h-14 border-b border-r border-slate-100 dark:border-[#2C2C2E] flex flex-col items-center justify-center ${isSameDay(d, TODAY) ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}`}>
                       <span className="text-[10px] uppercase font-black text-slate-400">{format(d, "EEE", { locale: ptBR })}</span>
                       <span className={`text-sm font-black ${isSameDay(d, TODAY) ? 'text-indigo-600' : 'text-slate-800 dark:text-white'}`}>{format(d, "dd")}</span>
                    </div>
                  ))}

                  {/* Grid Horários */}
                  {HOURS.map(h => (
                    <React.Fragment key={h}>
                       <div className="h-[70px] border-b border-r border-slate-100 dark:border-[#2C2C2E] flex items-start justify-center pt-2">
                          <span className="text-[10px] font-black text-slate-300 italic">{h}</span>
                       </div>
                       {weekDays.map(d => {
                          const iso = format(d, "yyyy-MM-dd");
                          const slotEvents = displayedEvents.filter(e => e.dateIso === iso && e.timeSlot === h);
                          return (
                            <DroppableSlot 
                              key={`${iso}|${h}`} 
                              id={`${iso}|${h}`} 
                              onClick={() => { resetForm(); setNewEventSlot({ dateIso: iso, timeSlot: h }); setModalOpen(true); }}
                            >
                               {slotEvents.map(ev => <DraggableEvent key={ev.id} event={ev} onClick={() => setViewEvent(ev)} />)}
                            </DroppableSlot>
                          )
                       })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
           </DndContext>
        </main>
      </div>

      {/* MODAL CRIAÇÃO */}
      {modalOpen && newEventSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-slate-100 dark:border-[#2C2C2E] scale-100 zoom-in-95">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Plus className="text-white w-6 h-6" /></div>
                 {editEventId ? 'Editar Evento' : 'Novo Lançamento'}
              </h2>
              <form onSubmit={handleSaveEvent} className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Nome do Evento</label>
                   <input 
                     required autoFocus value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)}
                     type="text" className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="Ex: Masterclass de Redação" 
                   />
                 </div>
                 
                 <div className="flex items-center justify-between bg-slate-50 dark:bg-[#2C2C2E] p-5 rounded-2xl border border-slate-200 dark:border-[#3A3A3C]">
                    <div className="flex items-center gap-3 text-indigo-600">
                       <Globe className="w-6 h-6" />
                       <div className="flex flex-col">
                          <span className="text-xs font-black uppercase">Público</span>
                          <span className="text-[10px] text-slate-400 font-bold leading-none">Visível a todos os alunos</span>
                       </div>
                    </div>
                    <button 
                      type="button" onClick={() => setIsPublicMarked(!isPublicMarked)}
                      className={`w-14 h-8 rounded-full p-1 transition-colors ${isPublicMarked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                       <div className={`w-6 h-6 bg-white rounded-full transition-transform ${isPublicMarked ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Data</label>
                      <input type="date" value={newEventSlot.dateIso} onChange={e => setNewEventSlot({...newEventSlot, dateIso: e.target.value})} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Hora</label>
                      <select value={newEventSlot.timeSlot} onChange={e => setNewEventSlot({...newEventSlot, timeSlot: e.target.value})} className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold">
                         {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                 </div>

                 <textarea value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} rows={3} placeholder="Descrição opcional..." className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium resize-none" />

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600">Cancelar</button>
                    <button type="submit" className="flex-1 bg-indigo-600 py-4 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest">Gravar no Servidor</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* VIEW EVENT */}
      {viewEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4" onClick={() => setViewEvent(null)}>
           <div className="bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl border border-slate-100 dark:border-[#2C2C2E]" onClick={e => e.stopPropagation()}>
              <div className={`p-6 rounded-[1.5rem] mb-6 flex items-center justify-between ${viewEvent.colorClass} border`}>
                 <h3 className={`text-xl font-black ${viewEvent.textClass}`}>{viewEvent.title}</h3>
                 {viewEvent.isPublic ? <Globe className="w-6 h-6 opacity-30" /> : <Lock className="w-6 h-6 opacity-30" />}
              </div>
              <div className="space-y-4 mb-10">
                 <div className="flex items-center gap-3 text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <CalendarIcon className="w-5 h-5" /> {format(parseISO(viewEvent.dateIso), "dd/MM/yyyy")} às {viewEvent.timeSlot}
                 </div>
                 {viewEvent.description && (
                   <div className="bg-slate-50 dark:bg-[#2C2C2E] p-5 rounded-2xl">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">{viewEvent.description}</p>
                   </div>
                 )}
              </div>
              <div className="flex gap-3">
                 <button onClick={() => handleDelete(viewEvent.id)} className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"><Trash2 /></button>
                 <button onClick={() => { 
                     setEditEventId(viewEvent.id); 
                     setNewEventTitle(viewEvent.title); 
                     setNewEventDesc(viewEvent.description || ''); 
                     setNewEventSlot({dateIso: viewEvent.dateIso, timeSlot: viewEvent.timeSlot}); 
                     setNewEventColor(`${viewEvent.colorClass} text-${viewEvent.textClass.replace('text-', '')}`); 
                     setIsPublicMarked(viewEvent.isPublic || false); 
                     setViewEvent(null); 
                     setModalOpen(true); 
                   }} className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"><Edit2 /></button>
                 <button onClick={() => setViewEvent(null)} className="flex-1 bg-slate-800 text-white font-black rounded-2xl text-xs uppercase tracking-widest">Fechar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
