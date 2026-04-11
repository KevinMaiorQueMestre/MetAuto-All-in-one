import { createClient } from "@/utils/supabase/client";

export type SummaryCards = {
  totalQuestoes: number;
  taxaAcertoGlobal: number; // 0-100
  horasEstudo: number;      // em horas (decimal)
};

export type PeriodoData = {
  name: string;
  acertos: number;
  erros: number;
  minutos: number;
};

export type DisciplinaData = {
  disciplina: string;
  minutos: number;
  desempenho: number; // % acerto
};

/**
 * Retorna os totais para os SummaryCards do dashboard.
 */
export async function getSummaryCards(userId: string): Promise<SummaryCards> {
  const supabase = createClient();

  // Total de questões lançadas no KevQuest
  const { count: totalQuestoes } = await supabase
    .from("kevquest_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Taxa de acerto global (média dos simulados)
  const { data: simulados } = await supabase
    .from("simulado_resultados")
    .select("acertos, total_questoes")
    .eq("user_id", userId);

  let taxaAcertoGlobal = 0;
  if (simulados && simulados.length > 0) {
    const totalAcertos = simulados.reduce((acc, s) => acc + s.acertos, 0);
    const totalQuestoesSimulados = simulados.reduce(
      (acc, s) => acc + s.total_questoes,
      0
    );
    taxaAcertoGlobal =
      totalQuestoesSimulados > 0
        ? Math.round((totalAcertos / totalQuestoesSimulados) * 100)
        : 0;
  }

  // Total de horas de estudo (sessões finalizadas)
  const { data: sessoes } = await supabase
    .from("sessoes_estudo")
    .select("duracao_segundos")
    .eq("user_id", userId)
    .not("duracao_segundos", "is", null);

  const totalSegundos =
    sessoes?.reduce((acc, s) => acc + (s.duracao_segundos ?? 0), 0) ?? 0;
  const horasEstudo = parseFloat((totalSegundos / 3600).toFixed(1));

  return {
    totalQuestoes: totalQuestoes ?? 0,
    taxaAcertoGlobal,
    horasEstudo,
  };
}

/**
 * Retorna dados de acertos/erros e minutos de estudo agrupados por dia (últimos N dias).
 */
export async function getEvolucao7Dias(userId: string): Promise<PeriodoData[]> {
  const supabase = createClient();
  const dias = 7;
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const { data: sessoes } = await supabase
    .from("sessoes_estudo")
    .select("duracao_segundos, iniciado_em")
    .eq("user_id", userId)
    .not("duracao_segundos", "is", null)
    .gte("iniciado_em", desde.toISOString());

  const { data: simulados } = await supabase
    .from("simulado_resultados")
    .select("acertos, total_questoes, realizado_em")
    .eq("user_id", userId)
    .gte("realizado_em", desde.toISOString());

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const result: PeriodoData[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const label = dayNames[d.getDay()];

    const minutos = Math.round(
      (sessoes ?? [])
        .filter((s) => s.iniciado_em.startsWith(dayStr))
        .reduce((acc, s) => acc + (s.duracao_segundos ?? 0), 0) / 60
    );

    const daySimulados = (simulados ?? []).filter((s) =>
      s.realizado_em.startsWith(dayStr)
    );
    const totalA = daySimulados.reduce((a, s) => a + s.acertos, 0);
    const totalQ = daySimulados.reduce((a, s) => a + s.total_questoes, 0);
    const acertos = totalQ > 0 ? Math.round((totalA / totalQ) * 100) : 0;

    result.push({ name: label, acertos, erros: 100 - acertos, minutos });
  }

  return result;
}

/**
 * Retorna dados agrupados pelas últimas 5 semanas.
 */
export async function getEvolucao5Semanas(userId: string): Promise<PeriodoData[]> {
  const supabase = createClient();
  const result: PeriodoData[] = [];

  for (let i = 4; i >= 0; i--) {
    const fim = new Date();
    fim.setDate(fim.getDate() - i * 7);
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 7);
    const label = `Sem ${5 - i}`;

    const { data: sessoes } = await supabase
      .from("sessoes_estudo")
      .select("duracao_segundos")
      .eq("user_id", userId)
      .not("duracao_segundos", "is", null)
      .gte("iniciado_em", inicio.toISOString())
      .lte("iniciado_em", fim.toISOString());

    const { data: simulados } = await supabase
      .from("simulado_resultados")
      .select("acertos, total_questoes")
      .eq("user_id", userId)
      .gte("realizado_em", inicio.toISOString())
      .lte("realizado_em", fim.toISOString());

    const minutos = Math.round(
      (sessoes ?? []).reduce((a, s) => a + (s.duracao_segundos ?? 0), 0) / 60
    );
    const totalA = (simulados ?? []).reduce((a, s) => a + s.acertos, 0);
    const totalQ = (simulados ?? []).reduce((a, s) => a + s.total_questoes, 0);
    const acertos = totalQ > 0 ? Math.round((totalA / totalQ) * 100) : 0;

    result.push({ name: label, acertos, erros: 100 - acertos, minutos });
  }

  return result;
}

/**
 * Retorna dados agrupados pelos últimos 3 meses.
 */
export async function getEvolucao3Meses(userId: string): Promise<PeriodoData[]> {
  const supabase = createClient();
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                 "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const result: PeriodoData[] = [];
  const now = new Date();

  for (let i = 2; i >= 0; i--) {
    const ano = now.getFullYear();
    const mes = now.getMonth() - i;
    const d = new Date(ano, mes, 1);
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const label = meses[d.getMonth()];

    const { data: sessoes } = await supabase
      .from("sessoes_estudo")
      .select("duracao_segundos")
      .eq("user_id", userId)
      .not("duracao_segundos", "is", null)
      .gte("iniciado_em", inicio)
      .lte("iniciado_em", fim);

    const { data: simulados } = await supabase
      .from("simulado_resultados")
      .select("acertos, total_questoes")
      .eq("user_id", userId)
      .gte("realizado_em", inicio)
      .lte("realizado_em", fim);

    const minutos = Math.round(
      (sessoes ?? []).reduce((a, s) => a + (s.duracao_segundos ?? 0), 0) / 60
    );
    const totalA = (simulados ?? []).reduce((a, s) => a + s.acertos, 0);
    const totalQ = (simulados ?? []).reduce((a, s) => a + s.total_questoes, 0);
    const acertos = totalQ > 0 ? Math.round((totalA / totalQ) * 100) : 0;

    result.push({ name: label, acertos, erros: 100 - acertos, minutos });
  }

  return result;
}

/**
 * Retorna tempo e desempenho agrupados por disciplina.
 */
export async function getTempoEDesempenhoPorDisciplina(
  userId: string
): Promise<DisciplinaData[]> {
  const supabase = createClient();

  const { data: sessoes } = await supabase
    .from("sessoes_estudo")
    .select("duracao_segundos, disciplinas(nome)")
    .eq("user_id", userId)
    .not("duracao_segundos", "is", null)
    .not("disciplina_id", "is", null);

  const { data: simulados } = await supabase
    .from("simulado_resultados")
    .select("acertos, total_questoes, disciplinas(nome)")
    .eq("user_id", userId)
    .not("disciplina_id", "is", null);

  // Agrupar por disciplina
  const map = new Map<string, { minutos: number; acertos: number; total: number }>();

  (sessoes ?? []).forEach((s: any) => {
    const nome = s.disciplinas?.nome ?? "Geral";
    const curr = map.get(nome) ?? { minutos: 0, acertos: 0, total: 0 };
    curr.minutos += Math.round((s.duracao_segundos ?? 0) / 60);
    map.set(nome, curr);
  });

  (simulados ?? []).forEach((s: any) => {
    const nome = s.disciplinas?.nome ?? "Geral";
    const curr = map.get(nome) ?? { minutos: 0, acertos: 0, total: 0 };
    curr.acertos += s.acertos;
    curr.total += s.total_questoes;
    map.set(nome, curr);
  });

  return Array.from(map.entries()).map(([disciplina, v]) => ({
    disciplina,
    minutos: v.minutos,
    desempenho: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
  }));
}
