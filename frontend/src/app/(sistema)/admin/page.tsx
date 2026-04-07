"use client";

import { useState, useEffect } from "react";
import { Users, CheckSquare, Megaphone, Radio, Trophy, Sparkles, Send, LayoutDashboard, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

// Mocks
const MOCK_USERS = [
  { id: "1", name: "João Alencar", email: "joao@email.com", xp: 12000, liga: "Diamante", acertos: 82 },
  { id: "2", name: "Maria Clara", email: "maria@email.com", xp: 9500, liga: "Ouro", acertos: 75 },
  { id: "3", name: "Pedro Silva", email: "pedro@email.com", xp: 15400, liga: "Mestre", acertos: 91 },
  { id: "4", name: "Ana Beatriz", email: "ana@email.com", xp: 4200, liga: "Prata", acertos: 55 },
  { id: "5", name: "Lucas Fernandes", email: "lucas@email.com", xp: 6800, liga: "Ouro", acertos: 62 },
];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [comunidadePosts, setComunidadePosts] = useState<any[]>([]);

  // Estados de Formulário
  const [avisoTitle, setAvisoTitle] = useState("");
  const [avisoDesc, setAvisoDesc] = useState("");

  // Polling para simular tempo real no Radar da Comunidade
  useEffect(() => {
    const fetchChat = () => {
      const savedComunidade = localStorage.getItem("@sinapse/comunidade");
      if (savedComunidade) {
        try {
          setComunidadePosts(JSON.parse(savedComunidade));
        } catch(e) {}
      }
    };
    fetchChat();
    const interval = setInterval(fetchChat, 2000); // Poll a cada 2 seg
    return () => clearInterval(interval);
  }, []);

  const handleSendAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitle.trim() || !avisoDesc.trim()) return;

    try {
      const savedAvisos = localStorage.getItem("@sinapse/avisos");
      const currentAvisos = savedAvisos ? JSON.parse(savedAvisos) : [];
      
      const newAviso = {
        id: crypto.randomUUID(),
        title: avisoTitle,
        description: avisoDesc,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now()
      };

      localStorage.setItem("@sinapse/avisos", JSON.stringify([newAviso, ...currentAvisos]));
      setAvisoTitle("");
      setAvisoDesc("");
      alert("Aviso Oficial publicado com sucesso na Home dos Alunos!");
    } catch(err) {
      console.error(err);
    }
  };



  const promoteLiga = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const ligasMap: Record<string, string> = { "Prata": "Ouro", "Ouro": "Diamante", "Diamante": "Mestre" };
        return { ...u, liga: ligasMap[u.liga] || u.liga };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4 md:px-0 font-sans">
      
      {/* HEADER */}
      <header className="mb-6 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-[1.2rem] shadow-lg shadow-indigo-600/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              Centro de Comando
            </h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 ml-2">Monitoramento de Alunos & Avisos Oficiais</p>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] px-6 py-3 rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
              Visão: Administrador Geral
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo - Ferramentas (4 colunas) */}
        <div className="space-y-8 lg:col-span-4 flex flex-col gap-6">
          
          {/* Postador de Avisos */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-6 border border-indigo-500 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
             <Megaphone className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none" />
             <div className="relative z-10">
               <h3 className="font-black text-white mb-6 flex items-center gap-2 text-lg">
                 <AlertCircle className="w-6 h-6"/>
                 Mural Oficial (Alunos)
               </h3>
               <form onSubmit={handleSendAviso} className="space-y-4">
                 <div>
                    <label className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.2em] mb-2 block">Título do Aviso</label>
                    <input 
                      type="text" 
                      value={avisoTitle} 
                      onChange={e => setAvisoTitle(e.target.value)}
                      required
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md"
                      placeholder="Ex: Novo Simulado Liberado! 🚨"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.2em] mb-2 block">Conteúdo Informativo</label>
                    <textarea 
                      value={avisoDesc} 
                      onChange={e => setAvisoDesc(e.target.value)}
                      required
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-white/50 outline-none transition-colors backdrop-blur-md resize-none"
                      placeholder="Detalhes para os alunos..."
                    />
                 </div>
                 <button className="w-full py-3 bg-white text-indigo-700 hover:bg-slate-100 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 justify-center">
                   <Send className="w-4 h-4"/> Publicar Aviso na Home
                 </button>
               </form>
             </div>
          </div>

        </div>

        {/* Lado Direito - Radar e Estudantes (8 colunas) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           
           {/* Radar da Comunidade (Chat Geral) */}
           <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-slate-100 dark:border-[#2C2C2E] shadow-sm flex flex-col overflow-hidden h-[400px]">
              <div className="px-6 py-4 border-b border-slate-50 dark:border-[#2C2C2E] flex justify-between items-center bg-slate-50/50 dark:bg-[#1C1C1E]">
                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Radar da Comunidade
                </h3>
                <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-bold px-3 py-1 rounded-full animate-pulse capitalize tracking-widest">Live Monitor</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 dark:bg-black/10 hidden-scrollbar">
                {comunidadePosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                     <Radio className="w-12 h-12 text-slate-300 mb-2" />
                     <p className="text-sm font-bold text-slate-400">Nenhuma conversa recente registrada.</p>
                  </div>
                ) : (
                  comunidadePosts.map((post, index) => (
                    <div key={post.id || index} className="flex gap-4 items-start animate-in slide-in-from-bottom-2">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {post.user?.[0] || "?"}
                      </div>
                      <div className="flex-1 bg-white dark:bg-[#2C2C2E] border border-slate-100 dark:border-[#3A3A3C] p-4 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-black text-slate-800 dark:text-white">{post.user}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{post.time}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {post.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>

           {/* Painel Gestão de Alunos */}
           <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500"/>
                  Gestão Base de Alunos
               </h2>
               <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">{users.length} ATIVOS</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {users.map((user, i) => (
                 <div key={user.id} className="bg-slate-50 dark:bg-[#2C2C2E]/50 p-4 rounded-2xl border border-slate-100 dark:border-[#3A3A3C] group hover:border-indigo-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                       <div>
                         <h3 className="font-black text-sm text-slate-800 dark:text-white truncate">{user.name}</h3>
                         <span className={`text-[10px] mt-1 inline-block font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                           user.liga === 'Mestre' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                           user.liga === 'Diamante' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' :
                           user.liga === 'Ouro' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                           'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                         }`}>
                           {user.liga}
                         </span>
                       </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-white/5 pt-3 mt-auto">
                       <button
                         onClick={() => promoteLiga(user.id)}
                         className="w-full bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider shadow-sm"
                       >
                         <Trophy className="w-3.5 h-3.5"/> Subir Nível
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           </div>

        </div>

      </div>
    </div>
  );
}
