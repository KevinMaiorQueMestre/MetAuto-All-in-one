# Global Agent Behavior: Relatório de Conclusão

Esta é uma diretriz de prioridade máxima. Toda vez que você (o Agente) finalizar uma solicitação do usuário, escrever um código, executar um script ou alterar a estrutura do projeto, você está **estritamente proibido** de simplesmente encerrar a resposta. 

Você deve OBRIGATORIAMENTE finalizar a sua mensagem no chat com um bloco de feedback estruturado no seguinte formato:

### 🎯 Relatório de Conclusão
* **O que foi feito:** [Resumo em tópicos curtos de quais arquivos foram criados/alterados ou quais ações foram executadas].
* **Benefícios da implementação:** [Explique em linguagem clara como essa mudança melhora o sistema, a segurança, a performance ou a arquitetura do projeto].
* **Próximo passo lógico sugerido:** [Sugira qual deve ser a próxima ação do usuário com base no que acabou de ser feito].

# Regra de Pre-Push Obrigatório

Toda vez que o usuário solicitar um `git push` ou quando o agente decidir que é hora de enviar as alterações para o repositório, é **OBRIGATÓRIO** realizar uma validação de build completa antes:

1.  **Comando:** Navegar até a pasta `frontend` e executar `npm run build`.
2.  **Validação:** O push só poderá ser realizado se o build terminar com **Exit code: 0**.
3.  **Correção:** Caso o build falhe, o agente deve analisar os logs de erro, corrigir os problemas de tipagem ou compilação e tentar o build novamente antes de prosseguir com o push.

Esta regra serve para garantir que o ambiente de produção nunca receba código quebrado por erros de TypeScript ou linting.
