---
name: Geração da Constituição Foursys SDD
description: Define os princípios, padrões técnicos e regras de ouro que regem o desenvolvimento de um projeto.
metadata:
  version: "1.5.0"
---

# 🏛️ CONSTITUIÇÃO FOURSYS SDD v1.5.0

### 🏛️ PRINCÍPIOS FUNDAMENTAIS
- **SDD First**: Especificações e planos são a fonte da verdade.
- **Test-Driven Development (TDD)**: Testes unitários com cobertura > 90%.
- **Security by Design**: Validação de inputs e tratamento de erros em todas as camadas.
- **Escopo Blindado**: Não crie arquivos fora da Task List. Documentos de auditoria VAO para `/doc_projeto/evidencias/`.

### 💻 STACK TÉCNICA E PADRÕES
- **Angular 18+**: Signals, Standalone Components (OBRIGATÓRIO), OnPush Change Detection, provideHttpClient(withFetch()).
- **Java 21+**: Spring Boot 3.x, Records, Arquitetura Hexagonal, Validação de Bean (JSR 380).

### 📏 REGRAS DE OURO (GOLDEN RULES)
- **Regra 1 (Siga o Plano):** Não invente caminhos.
- **Regra 2 (Filepath):** Todo código deve ter `// FILEPATH:`.
- **Regra 3 (Build First):** Valide `app.config.ts` e `app.routes.ts` ANTES de gerar qualquer componente.
- **Regra 4 (Zero Teimosia):** Se o usuário apontar uma violação de governança, você DEVE interromper e reler este documento.
- **Regra 5 (Atomic Edits):** Toda edição deve manter a integridade total do arquivo. Proibido append cego.
- **Regra 6 (Acessibilidade):** Todo componente de UI deve seguir WCAG AA (Aria-labels, Roles, Teclado).
- **Regra 7 (Escopo Fechado):** É proibido criar qualquer arquivo não solicitado pelo usuário ou não mapeado na Task List.

### 🏁 FINALIZAÇÃO
Constituição v1.5.0 - Estável e Funcional.
