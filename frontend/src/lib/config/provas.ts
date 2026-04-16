// Configuração e Estrutura dos Modelos de Provas (Vestibulares)

export type TipoInput = "numerico" | "certo_errado" | "informativo" | "redacao";

export interface CampoProva {
  id: string; // ex: 'linguagens', 'matematica'
  label: string; // ex: 'Linguagens', 'Ciências da Natureza'
  max: number; // max acertos
  tipo: TipoInput;
  cor: string; // Classes do Tailwind para dar cor ao card (ex: 'text-indigo-500 bg-indigo-500/10')
  detalhes?: string; // Usado para card informativo
}

export interface FaseProva {
  nome: string;
  dias: number; // Quantos timers vai precisar exibir
  temRedacao?: boolean;
  campos: CampoProva[];
}

export interface ModeloProva {
  id: string; // ID único, ex: 'ENEM', 'UNB'
  nome: string;
  fases: FaseProva[];
}

export const MODELOS_PROVAS: ModeloProva[] = [
  {
    id: "ENEM",
    nome: "ENEM",
    fases: [
      {
        nome: "Fase Única (2 Dias)",
        dias: 2,
        temRedacao: true,
        campos: [
          { id: "linguagens", label: "Linguagens", max: 45, tipo: "numerico", cor: "text-indigo-500" },
          { id: "humanas", label: "Humanas", max: 45, tipo: "numerico", cor: "text-amber-500" },
          { id: "naturezas", label: "Naturezas", max: 45, tipo: "numerico", cor: "text-emerald-500" },
          { id: "matematica", label: "Matemática", max: 45, tipo: "numerico", cor: "text-blue-500" },
        ]
      }
    ]
  },
  {
    id: "FUVEST_1",
    nome: "FUVEST - 1ª Fase",
    fases: [
      {
        nome: "1ª Fase",
        dias: 1,
        temRedacao: false,
        campos: [
          { id: "conhecimentos_gerais", label: "Conhecimentos Gerais", max: 90, tipo: "numerico", cor: "text-indigo-500" },
        ]
      }
    ]
  },
  {
    id: "FUVEST_2",
    nome: "FUVEST - 2ª Fase",
    fases: [
      {
        nome: "2ª Fase",
        dias: 2,
        temRedacao: true,
        campos: [
          { id: "dia1_info", label: "Dia 1 (Port/Lit/Redação)", max: 10, tipo: "informativo", cor: "text-slate-500", detalhes: "10 questões discursivas de PT/LIT." },
          { id: "dia2_info", label: "Dia 2 (Específicas)", max: 12, tipo: "informativo", cor: "text-slate-500", detalhes: "12 questões discursivas dependentes da carreira." },
        ]
      }
    ]
  },
  {
    id: "UNICAMP_1",
    nome: "UNICAMP - 1ª Fase",
    fases: [
      {
        nome: "1ª Fase",
        dias: 1,
        temRedacao: false,
        campos: [
          { id: "conhecimentos_gerais", label: "Conhecimentos Gerais", max: 72, tipo: "numerico", cor: "text-rose-500" },
        ]
      }
    ]
  },
  {
    id: "UNICAMP_2",
    nome: "UNICAMP - 2ª Fase",
    fases: [
      {
        nome: "2ª Fase",
        dias: 2,
        temRedacao: true,
        campos: [
          { id: "dia2_info", label: "Questões Específicas", max: 20, tipo: "informativo", cor: "text-slate-500", detalhes: "6 de Matemática, 2 interdisc de Humanas + 12 Específicas." },
        ]
      }
    ]
  },
  {
    id: "UNESP_1",
    nome: "UNESP - 1ª Fase",
    fases: [
      {
        nome: "1ª Fase",
        dias: 1,
        temRedacao: false,
        campos: [
          { id: "linguagens", label: "Linguagens", max: 30, tipo: "numerico", cor: "text-indigo-500" },
          { id: "humanas", label: "Humanas", max: 30, tipo: "numerico", cor: "text-amber-500" },
          { id: "nat_mat", label: "Natureza & Mat.", max: 30, tipo: "numerico", cor: "text-emerald-500" },
        ]
      }
    ]
  },
  {
    id: "UNESP_2",
    nome: "UNESP - 2ª Fase",
    fases: [
      {
        nome: "2ª Fase",
        dias: 1,
        temRedacao: true,
        campos: [
          { id: "discursivas_info", label: "Questões Discursivas", max: 36, tipo: "informativo", cor: "text-slate-500", detalhes: "36 Questões Discursivas (12 Ling, 12 Hum, 12 Nat/Mat)." },
        ]
      }
    ]
  },
  {
    id: "FAMERP",
    nome: "FAMERP",
    fases: [
      {
        nome: "Objetiva + Discursiva",
        dias: 2,
        temRedacao: true,
        campos: [
          { id: "matematica", label: "Matemática", max: 10, tipo: "numerico", cor: "text-blue-500" },
          { id: "biologia", label: "Biologia", max: 10, tipo: "numerico", cor: "text-emerald-500" },
          { id: "geografia", label: "Geografia", max: 10, tipo: "numerico", cor: "text-amber-500" },
          { id: "fisica", label: "Física", max: 10, tipo: "numerico", cor: "text-indigo-500" },
          { id: "historia", label: "História", max: 10, tipo: "numerico", cor: "text-amber-600" },
          { id: "quimica", label: "Química", max: 10, tipo: "numerico", cor: "text-teal-500" },
          { id: "portugues", label: "Português", max: 10, tipo: "numerico", cor: "text-rose-500" },
          { id: "ingles", label: "Inglês", max: 10, tipo: "numerico", cor: "text-purple-500" },
          { id: "dia2_info", label: "2º Dia Discursivo", max: 20, tipo: "informativo", cor: "text-slate-500", detalhes: "20 questões discursivas (Biologia, Química e Física)." }
        ]
      }
    ]
  },
  {
    id: "FAMEMA",
    nome: "FAMEMA",
    fases: [
      {
        nome: "Fase Única",
        dias: 1,
        temRedacao: true,
        campos: [
          { id: "conhecimentos_gerais", label: "Objetivas", max: 40, tipo: "numerico", cor: "text-emerald-500" },
          { id: "discursivas_info", label: "Discursivas", max: 4, tipo: "informativo", cor: "text-slate-500", detalhes: "4 Questões Discursivas." },
        ]
      }
    ]
  },
  {
    id: "UFU_1",
    nome: "UFU - 1ª Fase",
    fases: [
      {
        nome: "1ª Fase",
        dias: 1,
        temRedacao: false,
        campos: [
          { id: "conhecimentos_gerais", label: "Objetivas (11 Disc)", max: 88, tipo: "numerico", cor: "text-blue-500" }
        ]
      }
    ]
  },
  {
    id: "UFU_2",
    nome: "UFU - 2ª Fase",
    fases: [
      {
        nome: "2ª Fase",
        dias: 1,
        temRedacao: true,
        campos: [
          { id: "discursivas_info", label: "Discursivas", max: 22, tipo: "informativo", cor: "text-slate-500", detalhes: "2 questões abertas para cada uma das 11 disciplinas." },
        ]
      }
    ]
  },
  {
    id: "UNB",
    nome: "UNB",
    fases: [
      {
        nome: "Fase Única (1 Dia)",
        dias: 1,
        temRedacao: true,
        campos: [
          { id: "conhecimentos", label: "Conhecimentos", max: 120, tipo: "certo_errado", cor: "text-blue-500" }
        ]
      }
    ]
  }
];
