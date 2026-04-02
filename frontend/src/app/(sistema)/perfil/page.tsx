import { Mail, MapPin, Award, Flame } from "lucide-react";

export default function PerfilPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight">Detalhes do Aluno</h1>
      </header>
      
      <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        {/* Avatar Area */}
        <div className="bg-indigo-100 dark:bg-indigo-500/10 w-full md:w-48 h-48 rounded-3xl flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative group cursor-pointer">
           <img 
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e0e7ff" 
            alt="Avatar" 
            className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold uppercase tracking-wider">Alterar</span>
           </div>
        </div>

        {/* Info Area */}
        <div className="flex-1 space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-3">Matriculado Ativo</span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-[#FFFFFF] tracking-tight">João Silva Estudante</h2>
            <p className="text-sm text-slate-500 dark:text-[#A1A1AA] mt-1 font-medium">Turma Intensiva Medicina 2026</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">joao.silva@aluno.sinapse.com</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">São Paulo, SP - Brasil</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-[#2C2C2E] flex flex-wrap gap-3">
             <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-500/20">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">1º Lugar Simulado Oline</span>
             </div>
             <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-500/10 px-4 py-2 rounded-xl border border-teal-100 dark:border-teal-500/20">
                < Award className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">Meta Semanal Atingida (x4)</span>
             </div>
             <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 rounded-xl shadow-md text-white">
                <Flame className="w-4 h-4 fill-current" />
                <span className="text-xs font-bold">12 Dias Seguidos</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
