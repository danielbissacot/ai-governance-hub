---
name: springboot-testing
description: Skill para criar testes unitários significativos em projetos Spring Boot Java com JUnit 5, Mockito e AssertJ. Use ao implementar testes unitários para aplicações Spring Boot, melhorar cobertura de testes (meta ≥95%), validar regras de negócio, testar UseCases, modelos de Domain ou Adapters seguindo Arquitetura Hexagonal, garantindo qualidade e validando comportamento ao invés de detalhes de implementação seguindo as melhores práticas de arquitetura.
metadata:
  version: "0.0.1"
---

# Spring Boot Tests

Orientação para criar testes unitários significativos e focados em comportamento em projetos Spring Boot usando JUnit 5, Mockito e AssertJ.

## Princípios Centrais de Teste

### Teste Comportamento, Não Implementação

**❌ Evite:**
- Testar getters/setters
- Verificar chamadas de método sem afirmar resultados
- Testes que quebram ao refatorar a implementação interna
- Testes triviais que não validam comportamento real

**✅ Foque em:**
- Regras de negócio e lógica de domínio
- Cenários de erro e casos extremos
- Mudanças de estado e efeitos colaterais
- Integração entre componentes

### Cobertura vs Qualidade

Atingir **≥95% de cobertura** é necessário, mas não suficiente. Cada teste deve:

1. Validar regras de negócio reais
2. Cobrir cenários de sucesso e falha
3. Testar casos extremos relevantes
4. Ter nomes descritivos em estilo BDD: `should[Comportamento][QuandoCondicao]()`
5. Ser independente e determinístico (sem estado compartilhado entre testes)
6. Não quebrar ao refatorar implementação interna quando o comportamento observável permanece igual
7. Ter nome de método que descreva o comportamento esperado sem precisar ler o corpo do teste

## Testando por Camada

### Domain Models

Teste invariantes, regras de validação e comportamento do domínio.

**Regras obrigatórias:**
- O teste de Domain **não deve importar nenhuma classe de infraestrutura** (Spring, JPA, Feign, etc.)
- Valide que invariantes lançam exceção específica (não `RuntimeException` genérico) quando violados
- Use apenas `new` para construir objetos de domínio — sem mocks de entidades de domínio

**Para exemplos completos e padrões**, veja [references/DOMAIN_TESTING.md](REFERENCES/DOMAIN_TESTING.MD)

### UseCases

Teste orquestração da lógica de negócio, tratamento de erros e colaboração com ports.

**Regras obrigatórias:**
- Todos os ports (OutputPort, repositórios) devem ser mockados com `@Mock` / `Mockito.mock()`
- Valide tanto o caminho de sucesso quanto todos os caminhos de exceção mapeados no UseCase
- Nunca use `@SpringBootTest` em testes de UseCase — são testes unitários puros

**Para padrões abrangentes de testes de UseCase**, veja [references/USECASE_TESTING.md](REFERENCES/USECASE_TESTING.MD)

### Adapters

Teste mapeamento de DTO, validações e interação com infraestrutura.

**Regras obrigatórias:**
- Valide que o mapper converte corretamente todos os campos (sem campos ignorados silenciosamente)
- Para adapters de entrada (Controllers): use `@WebMvcTest` isolado, sem subir contexto completo
- Para adapters de saída (repositórios, clients): use mocks ou test doubles, nunca banco real em teste unitário

## Validação de Qualidade de Testes

Para garantir que seus testes seguem o padrão de excelência exigido, utilize sempre o nosso [Checklist de Testes](REFERENCES/TESTING_CHECKLIST.MD) antes de cada entrega.

## Organização dos Testes

Use test classes aninhadas e nomes descritivos:

```java
@DisplayName("Customer Registration - UseCase")
class CustomerRegistrationUseCaseTest {
    
    @Nested
    @DisplayName("Success Scenarios")
    class SuccessScenarios {
        @Test
        @DisplayName("Should register valid customer successfully")
        void shouldRegisterValidCustomer() { }
    }
    
    @Nested
    @DisplayName("Validation Failures")
    class ValidationFailures {
        @Test
        @DisplayName("Should reject customer with invalid CPF")
        void shouldRejectInvalidCpf() { }
    }
}
```

## Dependências Essenciais

```xml
<!-- JUnit 5 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<!-- Mockito -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>

<!-- AssertJ -->
<dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <scope>test</scope>
</dependency>

<!-- Spring Boot Test -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```
## Referência Rápida

**Antes de escrever um teste**, pergunte-se:
- Este teste valida uma regra de negócio ou comportamento importante?
- Ele quebraria se eu mudasse a implementação mas mantivesse o comportamento?
- O nome descreve claramente o comportamento esperado?
- O teste é independente dos demais?

**Para testes parametrizados, testes de exceção e padrões avançados**, veja [references/ADVANCED_PATTERNS.md](REFERENCES/ADVANCED_PATTERNS.MD)

