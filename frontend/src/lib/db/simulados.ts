import { createClient } from "@/utils/supabase/client";

export type SimuladoDB = {
  id: string;
  user_id: string;
  titulo_simulado: string;
  total_questoes: number;
  acertos: number;
  erros: number;
  disciplina_id: string | null;
  realizado_em: string;
  created_at: string;
  // Campos ENEM específicos
  linguagens: number;
  humanas: number;
  naturezas: number;
  matematica: number;
  redacao: number;
  tempo1_min: number;
  tempo2_min: number;
  tempo_red_min: number;
  tempo_total_min: number;
};

export type CriarSimuladoPayload = {
  userId: string;
  tituloSimulado: string;
  linguagens: number;
  humanas: number;
  naturezas: number;
  matematica: number;
  redacao: number;
  tempo1Min: number;
  tempo2Min: number;
  tempoRedMin: number;
};

/**
 * Lista todos os simulados do aluno, do mais recente para o mais antigo.
 */
export async function listarSimulados(userId: string): Promise<SimuladoDB[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("simulado_resultados")
    .select("*")
    .eq("user_id", userId)
    .order("realizado_em", { ascending: false });

  if (error) {
    console.error("[listarSimulados]", error.message);
    return [];
  }
  return (data ?? []) as SimuladoDB[];
}

/**
 * Cria um novo resultado de simulado no banco.
 */
export async function criarSimulado(
  payload: CriarSimuladoPayload
): Promise<SimuladoDB | null> {
  const supabase = createClient();

  const totalQuestoes =
    payload.linguagens + payload.humanas + payload.naturezas + payload.matematica;
  const acertos = totalQuestoes; // No contexto ENEM, cada área conta separadamente
  const tempoTotal = payload.tempo1Min + payload.tempo2Min + payload.tempoRedMin;

  const { data, error } = await supabase
    .from("simulado_resultados")
    .insert({
      user_id:          payload.userId,
      titulo_simulado:  payload.tituloSimulado,
      total_questoes:   180, // ENEM: 180 questões objetivas padrão
      acertos:          totalQuestoes,
      erros:            180 - totalQuestoes,
      linguagens:       payload.linguagens,
      humanas:          payload.humanas,
      naturezas:        payload.naturezas,
      matematica:       payload.matematica,
      redacao:          payload.redacao,
      tempo1_min:       payload.tempo1Min,
      tempo2_min:       payload.tempo2Min,
      tempo_red_min:    payload.tempoRedMin,
      tempo_total_min:  tempoTotal,
      realizado_em:     new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[criarSimulado]", error.message);
    return null;
  }
  return data as SimuladoDB;
}

/**
 * Deleta um simulado pelo ID.
 */
export async function deletarSimulado(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("simulado_resultados")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deletarSimulado]", error.message);
    return false;
  }
  return true;
}
