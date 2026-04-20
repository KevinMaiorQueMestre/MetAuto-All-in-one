import { createClient } from "@/utils/supabase/client";

export const ESTAGIO_ORDER = [
  "Quarentena",
  "Diagnostico",
  "UTI",
  "Refacao",
  "Consolidada",
] as const;

export type EstagioFunil = (typeof ESTAGIO_ORDER)[number];

export type KevQuestEntry = {
  id: string;
  user_id: string;
  disciplina_id: string | null;
  conteudo_id: string | null;
  sub_conteudo: string | null;
  estagio_funil: EstagioFunil;
  proxima_revisao_at: string | null;
  prova: string | null;
  ano: string | null;
  cor: string | null;
  comentario: string | null;
  q_num: string | null;
  // Adicionados na migration v2.1
  tipo_erro: 'teoria' | 'pratica' | 'desatencao' | null;
  data_refacao_1: string | null;
  data_refacao_2: string | null;
  data_refacao_3: string | null;
  created_at: string;
  updated_at: string;
  // Joins opcionais
  disciplinas?: { nome: string; cor_hex: string } | null;
  conteudos?: { nome: string } | null;
};

export type CreateEntryPayload = {
  userId: string;
  disciplinaId: string;
  conteudoId: string | null;
  subConteudo?: string | null;
  estagioFunil: EstagioFunil;
  proximaRevisaoAt?: string | null;
  prova?: string | null;
  ano?: string | null;
  cor?: string | null;
  comentario?: string | null;
  q_num?: string | null;
  tipoErro?: 'teoria' | 'pratica' | 'desatencao' | null;
};

/** Payload gerado ao enviar uma questão do funil para a aba Estudo. */
export type ProblemaEstudoPayload = {
  user_id: string;
  origem: 'kevquest';
  origem_ref_id: string;          // id do kevquest_entry
  titulo: string;
  prova: string | null;
  ano: string | null;
  cor_prova: string | null;
  q_num: string | null;
  disciplina_id: string | null;
  disciplina_nome: string | null;
  conteudo_id: string | null;
  conteudo_nome: string | null;
  sub_conteudo: string | null;
  tipo_erro: 'teoria' | 'pratica' | 'desatencao' | null;
  comentario: string | null;
};

/**
 * Cria uma nova entrada no funil KevQuest do aluno.
 */
export async function criarKevQuestEntry(
  payload: CreateEntryPayload
): Promise<KevQuestEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("kevquest_entries")
    .insert({
      user_id: payload.userId,
      disciplina_id: payload.disciplinaId,
      conteudo_id: payload.conteudoId ?? null,
      sub_conteudo: payload.subConteudo ?? null,
      estagio_funil: payload.estagioFunil,
      proxima_revisao_at: payload.proximaRevisaoAt ?? null,
      prova: payload.prova ?? null,
      ano: payload.ano ?? null,
      cor: payload.cor ?? null,
      comentario: payload.comentario ?? null,
      q_num: payload.q_num ?? null,
      tipo_erro: payload.tipoErro ?? null,
    })
    .select(
      "*, disciplinas(nome, cor_hex), conteudos(nome)"
    )
    .single();

  if (error) {
    console.error("[criarKevQuestEntry]", error.message);
    return null;
  }
  return data as KevQuestEntry;
}

/**
 * Lista todas as entradas do funil do aluno, com joins.
 */
export async function listarKevQuestEntries(
  userId: string,
  filtroEstagio?: EstagioFunil
): Promise<KevQuestEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from("kevquest_entries")
    .select("*, disciplinas(nome, cor_hex), conteudos(nome)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filtroEstagio) {
    query = query.eq("estagio_funil", filtroEstagio);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[listarKevQuestEntries]", error.message);
    return [];
  }
  return (data ?? []) as KevQuestEntry[];
}

/**
 * Atualiza o estágio do funil de uma entrada.
 */
export async function atualizarEstagioEntry(
  entryId: string,
  novoEstagio: EstagioFunil,
  proximaRevisaoAt?: string | null,
  comentarioUpdate?: string,
  tipoErroUpdate?: 'teoria' | 'pratica' | 'desatencao',
  datasRefacao?: { data_refacao_1: string; data_refacao_2: string; data_refacao_3: string }
): Promise<boolean> {
  const supabase = createClient();
  const updatePayload: any = {
    estagio_funil: novoEstagio,
    proxima_revisao_at: proximaRevisaoAt ?? null,
  };

  if (comentarioUpdate !== undefined) {
    updatePayload.comentario = comentarioUpdate;
  }
  if (tipoErroUpdate !== undefined) {
    updatePayload.tipo_erro = tipoErroUpdate;
  }
  // Grava as 3 datas de refação quando a questão entra no estágio "Refacao"
  if (datasRefacao) {
    updatePayload.data_refacao_1 = datasRefacao.data_refacao_1;
    updatePayload.data_refacao_2 = datasRefacao.data_refacao_2;
    updatePayload.data_refacao_3 = datasRefacao.data_refacao_3;
  }

  const { error } = await supabase
    .from("kevquest_entries")
    .update(updatePayload)
    .eq("id", entryId);

  if (error) {
    console.error("[atualizarEstagioEntry]", error.message);
    return false;
  }
  return true;
}

/**
 * Envia uma questão do KevQuest para a fila de Estudo.
 * Copia todos os dados contextuais da entrada (snapshot) para problemas_estudo.
 * Garante que o mesmo entry não seja enviado duas vezes (upsert por origem_ref_id).
 */
export async function enviarParaEstudo(
  entry: KevQuestEntry,
  userId: string
): Promise<boolean> {
  const supabase = createClient();

  // Monta o título automático com os dados disponíveis
  const partestitulo: string[] = [];
  if (entry.disciplinas?.nome) partestitulo.push(entry.disciplinas.nome);
  if (entry.conteudos?.nome) partestitulo.push(entry.conteudos.nome);
  if (entry.sub_conteudo) partestitulo.push(entry.sub_conteudo);
  const contexto = [entry.prova, entry.ano].filter(Boolean).join(' ');
  const titulo = partestitulo.length > 0
    ? `${partestitulo.join(' — ')}${contexto ? ` (${contexto})` : ''}`
    : `Questão ${entry.q_num ?? 'sem número'}${contexto ? ` — ${contexto}` : ''}`;

  const payload: ProblemaEstudoPayload = {
    user_id: userId,
    origem: 'kevquest',
    origem_ref_id: entry.id,
    titulo,
    prova: entry.prova,
    ano: entry.ano,
    cor_prova: entry.cor,
    q_num: entry.q_num,
    disciplina_id: entry.disciplina_id,
    disciplina_nome: entry.disciplinas?.nome ?? null,
    conteudo_id: entry.conteudo_id,
    conteudo_nome: entry.conteudos?.nome ?? null,
    sub_conteudo: entry.sub_conteudo,
    tipo_erro: entry.tipo_erro,
    comentario: entry.comentario,
  };

  // Upsert: se já foi enviado, atualiza os dados (ex: tipo_erro atualizado depois)
  const { error } = await supabase
    .from('problemas_estudo')
    .upsert(payload, { onConflict: 'origem_ref_id' });

  if (error) {
    console.error('[enviarParaEstudo]', error.message);
    return false;
  }
  return true;
}

/**
 * Remove uma entrada do funil.
 */
export async function deletarKevQuestEntry(entryId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("kevquest_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("[deletarKevQuestEntry]", error.message);
    return false;
  }
  return true;
}
