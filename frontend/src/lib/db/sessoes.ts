import { createClient } from "@/utils/supabase/client";

export type SessaoEstudo = {
  id: string;
  user_id: string;
  disciplina_id: string | null;
  conteudo_id: string | null;
  duracao_segundos: number | null;
  iniciado_em: string;
  finalizado_em: string | null;
};

/**
 * Registra o início de uma sessão de estudo.
 * Retorna o ID da sessão criada (usar para finalizar depois).
 */
export async function iniciarSessao(params: {
  userId: string;
  disciplinaId?: string | null;
  conteudoId?: string | null;
}): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessoes_estudo")
    .insert({
      user_id: params.userId,
      disciplina_id: params.disciplinaId ?? null,
      conteudo_id: params.conteudoId ?? null,
      iniciado_em: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[iniciarSessao]", error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Finaliza uma sessão de estudo, preenchendo a duração e o horário de fim.
 */
export async function finalizarSessao(
  sessaoId: string,
  duracaoSegundos: number
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("sessoes_estudo")
    .update({
      finalizado_em: new Date().toISOString(),
      duracao_segundos: duracaoSegundos,
    })
    .eq("id", sessaoId);

  if (error) {
    console.error("[finalizarSessao]", error.message);
    return false;
  }
  return true;
}

/**
 * Cancela/remove uma sessão que não foi finalizada corretamente.
 */
export async function cancelarSessao(sessaoId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("sessoes_estudo").delete().eq("id", sessaoId);
}
