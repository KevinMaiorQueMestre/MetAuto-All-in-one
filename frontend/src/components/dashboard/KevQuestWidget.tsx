"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { calcProximaRevisao, ESTAGIO_ORDER } from "../../lib/kevquestLogic";
import type { EstagioFunil } from "../../lib/kevquestLogic";
import { getDisciplinas, getConteudos } from "../../lib/db/disciplinas";
import type { Disciplina, Conteudo } from "../../lib/db/disciplinas";
import { criarKevQuestEntry } from "../../lib/db/kevquest";
import { createClient } from "@/utils/supabase/client";

export default function KevQuestWidget() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [disciplinaId, setDisciplinaId] = useState("");
  const [conteudoId, setConteudoId] = useState("");
  const [subConteudo, setSubConteudo] = useState("");
  const [estagio, setEstagio] = useState<EstagioFunil>("Quarentena");
  const [isPending, setIsPending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Carrega o usuário logado 1 vez
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Carrega disciplinas do banco ao montar
  useEffect(() => {
    getDisciplinas().then(setDisciplinas);
  }, []);

  // Carrega conteúdos quando a disciplina muda
  useEffect(() => {
    if (!disciplinaId) {
      setConteudos([]);
      setConteudoId("");
      return;
    }
    getConteudos(disciplinaId).then(setConteudos);
    setConteudoId("");
  }, [disciplinaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    if (!disciplinaId) {
      toast.error("Selecione a matéria.");
      return;
    }

    setIsPending(true);
    try {
      const proximaRevisaoAt = calcProximaRevisao(estagio);
      const entry = await criarKevQuestEntry({
        userId,
        disciplinaId,
        conteudoId: conteudoId || null,
        subConteudo: subConteudo || null,
        estagioFunil: estagio,
        proximaRevisaoAt,
      });

      if (entry) {
        const discNome = disciplinas.find((d) => d.id === disciplinaId)?.nome ?? "";
        const contNome = conteudos.find((c) => c.id === conteudoId)?.nome ?? "";
        toast.success(`✅ Lançado: ${discNome}${contNome ? ` › ${contNome}` : ""} → ${estagio}`);
        // Limpa os campos de conteúdo
        setSubConteudo("");
        setConteudoId("");
      } else {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    } catch (err) {
      toast.error("Falha inesperada ao salvar.");
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100 dark:border-[#2C2C2E] flex flex-col h-full animate-in fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF] tracking-tight">KevQuest Tracker</h2>
          <p className="text-sm text-slate-500 dark:text-[#A1A1AA] mt-1">Lógica Matemática Nativa Embutida</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-2xl">
          <PlusCircle className="text-orange-500 w-6 h-6" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        {/* Disciplina */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-2">
            Matéria
          </label>
          <select
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium transition-all"
          >
            <option value="">Selecione...</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>

        {/* Conteúdo */}
        <div className={`transition-all duration-300 ${!disciplinaId ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <label className="block text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-2">
            Assunto
          </label>
          <select
            value={conteudoId}
            onChange={(e) => setConteudoId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium transition-all"
          >
            <option value="">Selecione da lista...</option>
            {conteudos.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Sub-Conteúdo (campo livre) */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-2">
            Sub-assunto <span className="font-normal normal-case">(opcional)</span>
          </label>
          <input
            type="text"
            value={subConteudo}
            onChange={(e) => setSubConteudo(e.target.value)}
            placeholder="Ex: Crase em pronomes demonstrativos"
            className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium transition-all"
          />
        </div>

        {/* Estágio do Funil */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-[#71717A] uppercase tracking-wider mb-2">
            Funil Alvo
          </label>
          <select
            value={estagio}
            onChange={(e) => setEstagio(e.target.value as EstagioFunil)}
            className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#3A3A3C] rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-medium transition-all"
          >
            {ESTAGIO_ORDER.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending || !disciplinaId}
          className="mt-auto w-full bg-slate-800 text-white font-medium py-3.5 rounded-xl hover:bg-slate-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gerar Dados Lógicos"}
        </button>
      </form>
    </div>
  );
}
