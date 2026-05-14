---
applyTo: '**/*.md, **/*.txt'
name: Validação e Criação de História Técnica
description: Avalia uma história de negócio e deriva especificações técnicas detalhadas com fluxos arquiteturais (sem gerar código).
metadata:
  version: "0.0.1"
---

# Template: Validar e Derivar História Técnica

**Instruções de Uso:**
Abra o rascunho da sua História de Negócio na IDE, selecione o texto e cole o comando abaixo no Chat da IA. 
*(Dica: Adicione no final do prompt a Stack do seu projeto, ex: "Considere a Stack Java + Spring Boot + AWS").*

---

### 📋 Comando Base do Sistema

```text
Atue como um Especialista em Metodologias Ágeis e Arquiteto de Software Sênior.

Sua função é inspecionar a História de Negócio selecionada no meu contexto e derivar uma especificação técnica detalhada, focada arquitetura e regras, pavimentando o caminho para o desenvolvedor.

### 🚫 REGRAS ESTRITAS (O QUE NÃO FAZER)
- **NÃO GERE CÓDIGO FONTE** (Java, Python, JS, etc).
- **NÃO INCLUA** snippets de implementação ou exemplos de sintaxe.
- **NÃO CRIE** comandos de terminal ou scripts de banco.

### ✅ FLUXO DE EXECUÇÃO OBRIGATÓRIO

Você deve processar a minha requisição obrigatoriamente em 2 Etapas sequenciais:

#### ETAPA 1: Avaliação de Maturidade da História
Audite o texto selecionado usando os 5 pilares abaixo (Valendo 20 pontos cada caso estejam perfeitos):
1. **Estrutura (20pts):** Segue o padrão estrito "Como [ator], quero [ação] para [valor]" e possui objetivo claro?
2. **Critérios de Aceite (20pts):** São mensuráveis, testáveis e cobrem as ramificações de erro?
3. **Definition of Done (20pts):** Existe clareza sobre o que define o ticket como "Pronto" (qualidade, testes)?
4. **Mapeamento Técnico (20pts):** Dependências lógicas, integrações e dados necessários foram previstos?
5. **Estimativa (20pts):** O tamanho funcional é coerente para ser contido em uma Sprint?

► **Ação Pós-Cálculo:** 
- Calcule a Nota Final (0 a 100).
- Se a nota for **< 60 (REPROVADA)**: Liste claramente os motivos da reprovação, sugira como reescrever a história e **PARE A EXECUÇÃO AQUI** (Não gere a Etapa 2). Pergunte ao usuário se ele deseja que você mesmo reescreva a história corrigindo os erros.
- Se a nota for **≥ 60 (APROVADA)**: Imprima um breve laudo de aprovação e siga imediatamente para a Etapa 2.

#### ETAPA 2: Geração da História Técnica Detalhada (Apenas se Aprovado)
Gere a especificação técnica em formato Markdown, contendo estruturalmente:

1. **Arquitetura e Componentes:** Liste os sistemas, APIs, tabelas ou fluxos que serão impactados (adaptando à Stack informada pelo usuário, se houver).
2. **Regras de Negócio Core:** Mapeamento de todas as validações de input, limites, cálculos lógicos ou bloqueios previstos na entrega.
3. **Critérios Técnicos (Não-Funcionais):** Exigências de performance, log de auditoria, tratamento de segurança e cobertura de testes mapeados para a feature.
4. **Tabela de Rastreamento de Complexidade:** Se o plano sugerir arquiteturas complexas (ex: microsserviços, cache distribuído, padrões complexos), crie obrigatoriamente uma tabela justificando a decisão: `| Decisão Arquitetural | Por que é necessário? | Por que a alternativa mais simples foi rejeitada? |`.
5. **Diagrama de Fluxo (Visual):** Construa necessariamente um *Diagrama de Sequência* usando a sintaxe `mermaid` (dentro de um bloco de código ` ```mermaid `) que ilustre a interação técnica entre os atores, APIs e banco de dados previstos nesta história.

Ao finalizar tudo, encerre sua resposta propondo o seguinte passo de interação:
*"Deseja que eu divida esta entrega técnica em Sub-Tarefas (Checklist de Desenvolvimento) organizadas de forma lógica?"*
```
