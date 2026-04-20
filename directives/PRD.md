Documento de Requisitos de Produto (PRD)
Produto: Método Autônomo All-in-One
Status: Produto Consolidado (Live)
Objetivo Principal: Fornecer um ecossistema de organização estudantil que governa dados em um ciclo contínuo de avaliação, diagnóstico, estudo e revisão.

1. Visão Geral do Sistema
O sistema opera através de uma barra lateral (sidebar) com 10 abas principais. O fluxo principal é impulsionado pela transformação de dados brutos de desempenho em tarefas acionáveis de estudo e revisão, suportado por dashboards de evolução em múltiplos níveis.

2. Requisitos das Abas (Funcionalidades Principais)
2.1. Home
Objetivo: Visão consolidada do dia.

Requisitos:

Exibir informações gerais e painel de progresso diário.

Listar e permitir a conclusão das "Tarefas do dia" (agregadas das demais abas).

2.2. Organizador Semanal
Objetivo: Estruturação macro da rotina de estudos.

Requisitos:

Permitir a alocação de blocos de estudo na semana (Rotina).

Categorias de blocos disponíveis para alocação: Simulado, Diagnóstico, Estudo, Revisão Diária e Redação.

Exibir métricas de evolução: Número de simulados feitos, dias com metas batidas e consistência na execução de cada etapa.

2.3. Simulado
Objetivo: Registro e análise de provas completas.

Requisitos (Inputs):

Seleção/Digitação de: Prova, Ano, Aplicação, Dia (opcional) e Cor da Prova.

Registro de Acertos por disciplina e Tempo de resolução.

Requisitos (Saída):

Geração automática de tarefas de correção/diagnóstico com base no preenchimento.

Gráficos de Evolução micro focados no desempenho histórico do aluno nos simulados.

2.4. Kevquest (Funil de Diagnóstico)
Objetivo: Mapeamento granular de erros e direcionamento de estudos.

Requisitos (Inputs):

Registro de questões (Tarefas) atreladas a uma Disciplina/Conteúdo.

Classificação do erro no Diagnóstico: Teoria, Prática ou Desatenção.

Requisitos (Saída):

Geração de uma "Proposta de resolução" que será enviada para a aba de Estudo.

Gráfico Obrigatório: Gráfico de barras horizontais ou verticais por disciplina, segmentado obrigatoriamente em 3 cores distintas, representando a proporção exata dos erros (Teoria, Prática, Desatenção).

2.5. Redação
Objetivo: Gestão do ciclo de escrita e correção.

Requisitos (Inputs):

Definição da Proposta (Tarefa): Modelo/Prova, Tema e anexo de PDF.

Registro do Resultado: Nota alcançada e tempo gasto.

Diagnóstico: Registro do entendimento do erro apontado na correção e formulação da Proposta de resolução.

Requisitos (Saída):

Acompanhamento da Evolução (Nota e Tempo).

Envio da Proposta de resolução para a aba de Estudo (se aplicável).

2.6. Estudo
Objetivo: Central de execução do conteúdo teórico e prático.

Requisitos:

Recebimento e categorização de Tarefas de duas origens:

Sob demanda: Propostas de resolução originadas do Kevquest e Redação (ESD).

Passivas/Planejadas: Matéria escolhida pessoalmente ou pelo cursinho.

Registro de conclusão (Inputs de Tempo e Desempenho).

Evolução contabilizando tarefas concluídas e proporção entre os tipos de tarefas.

2.7. Calendário (Central de Revisões)
Objetivo: Gestão da retenção de memória a longo prazo.

Requisitos:

Visualização de calendário com revisões agendadas.

Painel de controle para registrar a conclusão das revisões do dia.

Gráficos de evolução demonstrando o volume de revisões feitas vs. agendadas.

2.8. Evolução Geral
Objetivo: Dashboard analítico macro do sistema.

Requisitos:

Consolidar os dados de Evolução de todas as abas anteriores.

Fornecer métricas cruzadas que demonstrem a eficácia geral do "Método Autônomo".

2.9. Ligas
Objetivo: Interação social e retenção gamificada.

Requisitos:

Sistema de criação e gestão de grupos entre alunos (Amigos) e Mentores.

Visualização de dados de desempenho e consistência de forma compartilhada/ranqueada, dependendo do nível de permissão (Aluno vs. Mentor).

2.10. Configuração
Objetivo: Gestão da conta e personalização do sistema.

Requisitos:

Edição do Perfil do usuário.

Painel para edição de variáveis globais e preferências do sistema.