// Configuração e Estrutura dos Modelos de Provas (Vestibulares)

export type TipoInput = "numerico" | "certo_errado" | "informativo" | "redacao";

export interface CampoProva {
  id: string; // ex: 'linguagens', 'matematica'
  label: string; // ex: 'Linguagens', 'Ciências da Natureza'
  max: number; // max acertos
  tipo: TipoInput;
  cor: string; // Classes do Tailwind para dar cor ao card (ex: 'text-indigo-500 bg-indigo-500/10')
  detalhes?: string; // Usado para card informativo
  dia?: number; // Para exibir apenas nos lançamentos de um dia específico
}

export interface FaseProva {
  nome: string;
  dias: number; // Quantos timers vai precisar exibir
  temRedacao?: boolean;
  diaRedacao?: number; // Em qual dia a redação é aplicada
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
        diaRedacao: 1,
        campos: [
          { id: "linguagens", label: "Linguagens", max: 45, tipo: "numerico", cor: "text-indigo-500", dia: 1 },
          { id: "humanas", label: "Humanas", max: 45, tipo: "numerico", cor: "text-amber-500", dia: 1 },
          { id: "naturezas", label: "Naturezas", max: 45, tipo: "numerico", cor: "text-emerald-500", dia: 2 },
          { id: "matematica", label: "Matemática", max: 45, tipo: "numerico", cor: "text-blue-500", dia: 2 },
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
        nome: "Fase Única (2 Dias)",
        dias: 2,
        temRedacao: true,
        diaRedacao: 1,
        campos: [
          { id: "conhecimentos", label: "Linguagens/Humanas", max: 180, tipo: "certo_errado", cor: "text-blue-500", dia: 1 },
          { id: "conhecimentos_d2", label: "Exatas/Natureza", max: 180, tipo: "certo_errado", cor: "text-emerald-500", dia: 2 }
        ]
      }
    ]
  }
];

export type ENEMDayConfig = {
  duracao: number; // minutos esperados
  areas: Array<{
    id: string;
    label: string;
    max: number;
    cor: string;
  }>;
  temRedacao: boolean;
};

export type ENEMConfig = {
  era: 'classica' | 'transitoria' | 'moderna';
  diasCount: number; // 1 ou 2
  dia1: ENEMDayConfig;
  dia2?: ENEMDayConfig;
};

export function getENEMConfig(year: number | string): ENEMConfig {
  const y = typeof year === 'string' ? parseInt(year) || 0 : year;

  // Era Clássica: 1998–2008 (único dia, 63 questões)
  if (y >= 1998 && y <= 2008) {
    return {
      era: 'classica',
      diasCount: 1,
      dia1: {
        duracao: 330, // 5h30
        areas: [{ id: 'questoes', label: 'Questões', max: 63, cor: 'text-indigo-500' }],
        temRedacao: true, // Redação existia
      },
    };
  }

  // Era Transitória: 2009–2016
  // Dia 1: Humanas + Natureza (4h30) | Dia 2: Linguagens + Matemática + Redação (5h30)
  if (y >= 2009 && y <= 2016) {
    return {
      era: 'transitoria',
      diasCount: 2,
      dia1: {
        duracao: 270, // 4h30
        areas: [
          { id: 'humanas', label: 'Humanas', max: 45, cor: 'text-amber-500' },
          { id: 'naturezas', label: 'Naturezas', max: 45, cor: 'text-emerald-500' },
        ],
        temRedacao: false,
      },
      dia2: {
        duracao: 330, // 5h30
        areas: [
          { id: 'linguagens', label: 'Linguagens', max: 45, cor: 'text-indigo-500' },
          { id: 'matematica', label: 'Matemática', max: 45, cor: 'text-blue-500' },
        ],
        temRedacao: true,
      },
    };
  }

  // Era Moderna: 2017+
  // Dia 1: Linguagens + Humanas + Redação (5h30) | Dia 2: Naturezas + Matemática (5h00)
  return {
    era: 'moderna',
    diasCount: 2,
    dia1: {
      duracao: 330, // 5h30
      areas: [
        { id: 'linguagens', label: 'Linguagens', max: 45, cor: 'text-indigo-500' },
        { id: 'humanas', label: 'Humanas', max: 45, cor: 'text-amber-500' },
      ],
      temRedacao: true,
    },
    dia2: {
      duracao: 300, // 5h00 (Conforme correção do usuário)
      areas: [
        { id: 'naturezas', label: 'Naturezas', max: 45, cor: 'text-emerald-500' },
        { id: 'matematica', label: 'Matemática', max: 45, cor: 'text-blue-500' },
      ],
      temRedacao: false,
    },
  };
}

export function getExamItemCount(year: number | string, day: number): number {
  const y = typeof year === 'string' ? parseInt(year) || 0 : year;
  if (!y) return 150; 
  if (y <= 2010) {
    return day === 1 ? 150 : 180;
  }
  if (y >= 2011 && y <= 2024) {
    return 150;
  }
  if (y === 2025) {
    return day === 1 ? 120 : 150;
  }
  return 120; 
}

export type FUVESTFase1Config = {
  max: number;        // 90 ou 80
  duracao: number;    // sempre 300 min (5h)
  era: 'classica' | 'moderna'; // ≤2026 ou ≥2027
};

export type FUVESTFase2Config = {
  diasCount: number;    // 2 ou 3
  era: 'trifasica' | 'bifasica'; // ≤2018 ou ≥2019
  dias: Array<{
    numero: number;
    label: string;
    detalhes: string;
    maxQuestoes: number;
    temRedacao: boolean;
    duracao: number; // minutos
  }>;
};

export function getFUVESTFase1Config(year: number | string): FUVESTFase1Config {
  const y = typeof year === 'string' ? parseInt(year) || 0 : year;
  if (y >= 2027) return { max: 80, duracao: 300, era: 'moderna' };
  return { max: 90, duracao: 300, era: 'classica' };
}

export function getFUVESTFase2Config(year: number | string): FUVESTFase2Config {
  const y = typeof year === 'string' ? parseInt(year) || 0 : year;

  if (y <= 2018) {
    return {
      era: 'trifasica',
      diasCount: 3,
      dias: [
        { numero: 1, label: 'Dia 1 — Português e Redação', detalhes: 'Questões discursivas de Port./Lit. + Redação.', maxQuestoes: 0, temRedacao: true, duracao: 300 },
        { numero: 2, label: 'Dia 2 — Gerais', detalhes: '16 questões discursivas gerais.', maxQuestoes: 16, temRedacao: false, duracao: 300 },
        { numero: 3, label: 'Dia 3 — Específicas', detalhes: '12 questões discursivas específicas da carreira.', maxQuestoes: 12, temRedacao: false, duracao: 300 },
      ]
    };
  }

  // ≥ 2019 — formato atual
  return {
    era: 'bifasica',
    diasCount: 2,
    dias: [
      { numero: 1, label: 'Dia 1 — Port./Lit. e Redação', detalhes: '10 questões discursivas de Port./Lit. + Redação.', maxQuestoes: 10, temRedacao: true, duracao: 300 },
      { numero: 2, label: 'Dia 2 — Específicas', detalhes: '12 questões discursivas específicas da carreira.', maxQuestoes: 12, temRedacao: false, duracao: 300 },
    ]
  };
}
