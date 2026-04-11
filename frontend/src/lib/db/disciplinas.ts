import { createClient } from "@/utils/supabase/client";

export type Disciplina = {
  id: string;
  nome: string;
  cor_hex: string;
  icone: string | null;
  ordem: number;
};

export type Conteudo = {
  id: string;
  disciplina_id: string;
  nome: string;
  ordem: number;
};

/**
 * Busca todas as disciplinas ordenadas.
 */
export async function getDisciplinas(): Promise<Disciplina[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disciplinas")
    .select("id, nome, cor_hex, icone, ordem")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("[getDisciplinas]", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Busca conteúdos de uma disciplina específica.
 */
export async function getConteudos(disciplinaId: string): Promise<Conteudo[]> {
  if (!disciplinaId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conteudos")
    .select("id, disciplina_id, nome, ordem")
    .eq("disciplina_id", disciplinaId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("[getConteudos]", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Busca todas as disciplinas com seus conteúdos aninhados.
 * Útil para carregar tudo de uma vez.
 */
export async function getDisciplinasComConteudos(): Promise<
  (Disciplina & { conteudos: Conteudo[] })[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("disciplinas")
    .select("id, nome, cor_hex, icone, ordem, conteudos(id, disciplina_id, nome, ordem)")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("[getDisciplinasComConteudos]", error.message);
    return [];
  }
  return (data ?? []) as (Disciplina & { conteudos: Conteudo[] })[];
}
