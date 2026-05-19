---
name: Auditoria SDD das Skills Java
description: Relatório de auditoria e registro de correções aplicadas nas Skills Java em 2026-05-19
metadata:
  version: "1.0.0"
  data: "2026-05-19"
  autor: "Daniel Barbosa Bissaco"
  branch: "hub-ia-arquitetura"
---

# Auditoria SDD — Skills Java Spring Boot

**Data:** 2026-05-19  
**Branch:** hub-ia-arquitetura  
**Escopo:** 5 Skills Java + AGENTE_SPRING_FOURSYS  
**Metodologia:** Revisão SDD (Clareza · Completude · Consistência · Verificabilidade · Anti-Alucinação)

---

## Resumo Executivo

| Skill | Clareza antes | Completude antes | Consistência antes | Verificab. antes | Status |
|---|---|---|---|---|---|
| Testing | 6/10 | 5/10 | 5/10 | 5/10 | ✅ Corrigido |
| Kafka | 5/10 | 3/10 | 5/10 | 4/10 | ✅ Corrigido |
| Feign Client | 6/10 | 5/10 | 7/10 | 6/10 | ✅ Corrigido |
| REST Client | 7/10 | 6/10 | 6/10 | 7/10 | ✅ Corrigido |
| MongoDB | 7/10 | 7/10 | 8/10 | 6/10 | ✅ Corrigido |

**Problema transversal crítico resolvido:** Inconsistência de cobertura de testes (95% na Skill vs 90% na constitution) — alinhado para ≥95%.

---

## SKILL_SPRINGBOOT_TESTING.md

### Problemas corrigidos

**[P1] Cobertura inconsistente com a constitution**
- Antes: `"Atingir ≥95% de cobertura é necessário"` vs constitution `">90%"`
- Depois: Skill mantém `≥95%` como valor definitivo; constitution deve ser alinhada na Parte 2 (plugin)
- Impacto: Todo projeto Java governado pelo plugin recebia meta inferior à da Skill

**[P2] Item 6 inverificável: "Falhar pelos motivos corretos"**
- Antes: frase subjetiva sem critério objetivo
- Depois: `"Não quebrar ao refatorar implementação interna quando o comportamento observável permanece igual"`

**[P3] Item 7 inverificável: "Servir como documentação viva"**
- Antes: frase vaga sem critério
- Depois: `"Ter nome de método que descreva o comportamento esperado sem precisar ler o corpo do teste"` com padrão `should[Comportamento][QuandoCondicao]()`

**[P4] Body sem regras substantivas por camada**
- Antes: 1-2 frases por camada, tudo delegado para reference files
- Depois: Adicionadas regras obrigatórias explícitas para Domain, UseCases e Adapters diretamente no body

### Regras adicionadas por camada

**Domain:**
- Não importar classes de infraestrutura
- Invariantes lançam exceção específica (não RuntimeException genérico)
- Usar apenas `new` para construir objetos de domínio

**UseCases:**
- Todos os ports mockados com `@Mock`
- Cobrir caminho de sucesso e todos os caminhos de exceção
- Nunca usar `@SpringBootTest` em testes de UseCase

**Adapters:**
- Validar que mapper converte todos os campos
- Controllers: `@WebMvcTest` isolado
- Repositórios/Clients: mocks ou test doubles

---

## SKILL_SPRINGBOOT_KAFKA.md

### Problemas corrigidos

**[P1] JDK inconsistente com AGENTE_SPRING_FOURSYS**
- Antes: `"JDK 17 ou superior"`
- Depois: `"JDK 21 (obrigatório, alinhado com AGENTE_SPRING_FOURSYS)"`

**[P2] Skill principal sem regras de producer/consumer**
- Antes: apenas estrutura hexagonal + pointer para reference files
- Depois: adicionadas seções com configuração mínima obrigatória para producer e consumer

**[P3] Referência a "guia de segurança" sem link**
- Antes: `"conforme guia de segurança"` — inverificável
- Depois: comando `keytool` completo + URL do certificado ISRG Root X1

**[P4] Retry/DLT prometido mas ausente no body**
- Antes: mencionado em "Quando usar" mas sem regras no corpo
- Depois: seção completa com `@RetryableTopic`, backoff, sufixo `.DLT` obrigatório e regras de ack

### Configurações mínimas adicionadas

**Producer:** `acks: all`, `enable.idempotence: true`, `retries: 3`  
**Consumer:** `group-id` via variável de ambiente, `enable-auto-commit: false`, `auto-offset-reset: earliest`  
**DLT:** sufixo `.DLT` obrigatório, `@RetryableTopic` com `attempts = 3` e backoff exponencial

---

## SKILL_SPRINGBOOT_FEIGN_CLIENT.md

### Problemas corrigidos

**[P1] Catch block sem ação prescrita**
- Antes: comentários `// 400 - Requisição inválida` sem ação
- Depois: cada status HTTP com exceção de domínio específica obrigatória (NotFound, BadRequest, Unauthorized/Forbidden, InternalServerError)

**[P2] `CustomRetryer` referenciado sem implementação**
- Antes: `retryer: com.empresa.config.CustomRetryer` no YAML de prod — classe inexistente
- Depois: linha removida; Bean `feignRetryer()` em Java é o padrão para todos os ambientes

**[P3] Fallback retornava `null`**
- Antes: `return null; // Retorna null ou resposta default`
- Depois: ambos os métodos lançam `ServicoExternoIndisponivelException` com regra explícita: "Fallback NUNCA retorna null"

**[P4] MapStruct listado como dependência sem mandato de uso**
- Antes: dependência no pom.xml sem regra de uso
- Depois: seção "Regra: Mapper ACL com MapStruct (obrigatório)" com exemplo completo de `@Mapper(componentModel = "spring")`

---

## SKILL_SPRINGBOOT_REST_CLIENT.md

### Problemas corrigidos

**[P1] Resilience4j prescrito sem thresholds mínimos**
- Antes: `"Use Resilience4j para retry e circuit breaker"` — sem parâmetros
- Depois: YAML com thresholds mínimos obrigatórios (`slidingWindowSize: 10`, `failureRateThreshold: 50`, `waitDurationInOpenState: 10s`, retry `maxAttempts: 3`)

**[P2] Exemplo usava `RuntimeException` genérico**
- Antes: `throw new RuntimeException("Usuário não encontrado: " + cpf)`
- Depois: `throw new UsuarioNaoEncontradoException(cpf)` com regra: "nunca use RuntimeException genérico"

**[P3] Apenas status 4xx tratado no exemplo**
- Antes: somente `onStatus(HttpStatusCode::is4xxClientError, ...)`
- Depois: handler 5xx adicionado com `ServicoExternoIndisponivelException` + regra: "sempre trate 5xx explicitamente"

---

## SKILL_SPRINGBOOT_MONGODB.md

### Problemas corrigidos

**[P1] "consultados frequentemente" subjetivo**
- Antes: `"SEMPRE crie índices para campos consultados frequentemente"`
- Depois: `"Crie índice para todo campo usado em cláusula de filtro (Criteria.where() ou @Query). Sem exceções por frequência."`

**[P2] "agregações complexas" subjetivo**
- Antes: `"Use MongoTemplate apenas quando: Agregações complexas"`
- Depois: critério objetivo — pipeline com mais de um estágio (`$group`, `$lookup`, `$facet`), ou operações que o Repository não suporta mesmo com `@Query`

**[P3] Critério de transação inverificável**
- Antes: `"Use apenas quando necessário (consistência crítica)"`
- Depois: `"Use transações apenas quando duas ou mais coleções precisam ser modificadas atomicamente na mesma operação de negócio"`

**[P4] "grandes datasets" sem threshold**
- Antes: `"Evite offset em grandes datasets"`
- Depois: `"Evite paginação por offset quando a coleção tiver mais de 10.000 documentos"`

---

## Pendências para Parte 2 (branch ai-governance-plugin-java)

| Item | Arquivo | Descrição |
|---|---|---|
| Cobertura constitution | `foursys-constitution.md` | Atualizar >90% para ≥95% |
| Bug spring_boot agent | `catalog-loader.ts` | `AGENTE_SPRING_BOOT_FOURSYS.md` → `AGENTE_SPRING_FOURSYS.md` |
| Versão UI divergente | `sidebar-provider.ts` | `v2.2.0` → `v2.4.0` |
| VSIX Java independente | `foursys-sdd-engine-java/` | Novo plugin com ajustes acima |
