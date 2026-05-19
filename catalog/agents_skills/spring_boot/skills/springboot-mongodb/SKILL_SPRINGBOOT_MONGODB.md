---
name: springboot-mongodb
description: Use para implementar persistência com MongoDB usando Spring Data MongoDB em projetos Spring Boot com arquitetura hexagonal. Use quando precisar realizar operações CRUD, queries complexas, transações, ou implementar repositories MongoDB seguindo padrões de desempenho e indexação.
metadata:
  version: "0.0.1"
---

# Spring Boot MongoDB

Este skill fornece instruções detalhadas para implementar persistência com MongoDB usando Spring Data MongoDB em projetos Spring Boot seguindo arquitetura hexagonal e boas práticas de performance.

## Quando usar este skill

Use este skill quando:
- Precisar persistir dados no MongoDB
- Implementar repositories e queries customizadas
- Configurar e usar transações MongoDB
- Seguir arquitetura hexagonal com camada de persistência isolada
- Implementar paginação eficiente
- Criar índices para otimização de queries
- Trabalhar com queries complexas usando JSON ou SpEL

## Pré-Requisitos

- **JDK 17** ou superior
- **Maven**
- **Spring Boot 3.x.x**
- **MongoDB 4.4** ou superior (para suporte a transações)

## Dependências necessárias

Adicione a seguinte dependência no `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

## Configuração de Conexão

Configure a conexão MongoDB no `application.yml`:

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGO_URI:mongodb://localhost:27017}
      database: ${MONGO_DATABASE:seu_database}
      # Para conexão com autenticação
      # uri: mongodb://username:password@host:27017/database?authSource=admin
```

## Estrutura na Arquitetura Hexagonal

Para implementação de persistência MongoDB em arquitetura hexagonal, siga os princípios de isolamento entre camadas:

### Persistência (Output)
- **OutputPort** (`port/output/`): Define contratos em linguagem de domínio para persistência
- **Repository Adapter** (`adapter/output/mongodb/repository/`): Implementa OutputPort usando MongoDB
- **Entity/Document** (`adapter/output/mongodb/entity/`): Documentos MongoDB com anotações
- **Mapper** (`adapter/output/mongodb/mapper/`): Traduz entre entidades de domínio e documentos MongoDB

**📖 Consulte**: [references/MONGODB_REPOSITORY_INTEGRATION.md](references/MONGODB_REPOSITORY_INTEGRATION.md) para estrutura detalhada com exemplos

## MongoDB Repository vs MongoTemplate

### MongoDB Repository (Preferível)

✅ **Use MongoDB Repository quando:**
- Operações CRUD simples
- Queries derivadas de nomes de métodos
- Paginação e ordenação padrão
- Queries customizadas com @Query

```java
public interface AccountRepository extends MongoRepository<AccountDocument, String> {
    Optional<AccountDocument> findByAccountNumber(String accountNumber);
    
    @Query("{ 'status': ?0, 'balance': { $gte: ?1 } }")
    List<AccountDocument> findActiveAccountsWithMinBalance(String status, BigDecimal minBalance);
}
```

**📖 Consulte**: [references/MONGODB_REPOSITORY_INTEGRATION.md](references/MONGODB_REPOSITORY_INTEGRATION.md) para detalhes

### MongoTemplate (Para casos complexos)

⚠️ **Use MongoTemplate apenas quando o `MongoRepository` não suportar nativamente a operação:**
- Agregações com mais de um estágio de pipeline (`$group`, `$lookup`, `$facet`)
- Operações bulk customizadas
- Queries dinâmicas construídas em runtime (critérios variáveis)
- Operações que o Repository não suporta mesmo com `@Query`

```java
@Component
public class CustomAccountRepository {
    private final MongoTemplate mongoTemplate;
    
    public List<AccountDocument> complexAggregation() {
        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("status").is("ACTIVE")),
            Aggregation.group("type").sum("balance").as("total"),
            Aggregation.sort(Sort.by(Sort.Direction.DESC, "total"))
        );
        return mongoTemplate.aggregate(aggregation, "accounts", AccountDocument.class)
            .getMappedResults();
    }
}
```

**📖 Consulte**: [references/MONGODB_TEMPLATE_USAGE.md](references/MONGODB_TEMPLATE_USAGE.md) para detalhes

## Queries com @Query - JSON e SpEL

O Spring Data MongoDB suporta queries usando JSON MongoDB e expressões SpEL:

### JSON Query Simples
```java
@Query("{ 'status': ?0 }")
List<AccountDocument> findByStatus(String status);
```

### JSON Query com SpEL
```java
@Query("{ 'createdAt': { $gte: ?#{[0]}, $lte: ?#{[1]} } }")
List<AccountDocument> findByDateRange(LocalDateTime start, LocalDateTime end);

@Query("{ 'balance': { $gte: ?#{#minBalance} } }")
List<AccountDocument> findByMinimumBalance(@Param("minBalance") BigDecimal minBalance);
```

### Query com projeção
```java
@Query(value = "{ 'status': ?0 }", fields = "{ 'accountNumber': 1, 'name': 1 }")
List<AccountDocument> findAccountSummaryByStatus(String status);
```

**📖 Consulte**: [references/MONGODB_QUERY_METHODS.md](references/MONGODB_QUERY_METHODS.md) para exemplos avançados

## Transações MongoDB

O MongoDB suporta transações multi-documento a partir da versão 4.0 (replica sets) e 4.2 (sharded clusters).

### Configuração

```java
@Configuration
@EnableMongoRepositories(basePackages = "com.empresa.adapter.output.mongodb")
public class MongoConfig {
    
    @Bean
    MongoTransactionManager transactionManager(MongoDatabaseFactory dbFactory) {
        return new MongoTransactionManager(dbFactory);
    }
}
```

### Uso com @Transactional

```java
@Service
public class TransferUseCase {
    
    @Transactional  // Requer MongoTransactionManager
    public void transferFunds(String fromAccount, String toAccount, BigDecimal amount) {
        // Todas operações dentro desta transação
        accountRepository.debit(fromAccount, amount);
        accountRepository.credit(toAccount, amount);
        transactionHistoryRepository.save(new Transaction(...));
    }
}
```

**⚠️ Importante:**
- Transações requerem replica set ou sharded cluster
- Transações têm impacto em performance
- Use transações apenas quando **duas ou mais coleções precisam ser modificadas atomicamente na mesma operação de negócio**. Se apenas uma coleção é modificada, não use transação.

**📖 Consulte**: [references/MONGODB_TRANSACTIONS.md](references/MONGODB_TRANSACTIONS.md) para detalhes e boas práticas

## Paginação - Boas Práticas

### Paginação Básica (Repository)

```java
public interface AccountRepository extends MongoRepository<AccountDocument, String> {
    Page<AccountDocument> findByStatus(String status, Pageable pageable);
}

// Uso
Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
Page<AccountDocument> page = accountRepository.findByStatus("ACTIVE", pageable);
```

### Paginação Eficiente (Cursor-based)

⚠️ **Evite paginação por offset quando a coleção tiver mais de 10.000 documentos:**
```java
// ❌ Ineficiente para coleções grandes — skip de 20.000 documentos!
PageRequest.of(1000, 20);
```

✅ **Use cursor-based pagination:**
```java
@Query("{ '_id': { $gt: ?0 }, 'status': ?1 }")
List<AccountDocument> findByStatusAfterCursor(
    String lastId, 
    String status, 
    Pageable pageable
);
```

**📖 Consulte**: [references/MONGODB_PAGINATION.md](references/MONGODB_PAGINATION.md) para estratégias avançadas

## Indexação - Boas Práticas

⚠️ **Crie índice para todo campo usado em cláusula de filtro (`Criteria.where()` ou `@Query`). Sem exceções por frequência.**

**Quando criar uma query, sempre verificar se índice é necessário e avisar o usuário:**

```java
// ✅ Exemplo: Query com índice necessário
@Query("{ 'status': ?0, 'balance': { $gte: ?1 } }")
List<AccountDocument> findByStatusAndMinBalance(String status, BigDecimal minBalance);

// ⚠️ AVISO: Esta query requer índice composto em (status, balance) para performance ideal!
// Criar índice: db.accounts.createIndex({ "status": 1, "balance": 1 })
```

## Boas Práticas Gerais

### 1. Evite fetch desnecessário
```java
// ❌ Evite trazer documentos completos
List<AccountDocument> findAll();

// ✅ Use projeções
@Query(value = "{}", fields = "{ 'accountNumber': 1, 'name': 1 }")
List<AccountDocument> findAllSummary();
```

### 2. Use batch operations
```java
// ✅ Inserções em lote
accountRepository.saveAll(accounts);
```

### 3. Limite resultados
```java
List<AccountDocument> findTop10ByStatusOrderByBalanceDesc(String status);
```

### 4. Crie índices para campos consultados frequentemente

## Referências Detalhadas

- **[MONGODB_REPOSITORY_INTEGRATION.md](references/MONGODB_REPOSITORY_INTEGRATION.md)** - Implementação completa com arquitetura hexagonal
- **[MONGODB_TEMPLATE_USAGE.md](references/MONGODB_TEMPLATE_USAGE.md)** - MongoTemplate para queries complexas
- **[MONGODB_QUERY_METHODS.md](references/MONGODB_QUERY_METHODS.md)** - Queries customizadas com @Query, JSON e SpEL
- **[MONGODB_TRANSACTIONS.md](references/MONGODB_TRANSACTIONS.md)** - Configuração e boas práticas de transações
- **[MONGODB_PAGINATION.md](references/MONGODB_PAGINATION.md)** - Estratégias eficientes de paginação

## Links Oficiais

- [Spring Data MongoDB - Template Operations](https://docs.spring.io/spring-data/mongodb/reference/mongodb/template-query-operations.html)
- [Spring Data MongoDB - CRUD Operations](https://docs.spring.io/spring-data/mongodb/reference/mongodb/template-crud-operations.html)
- [Spring Data MongoDB - Transactions](https://docs.spring.io/spring-data/mongodb/reference/mongodb/client-session-transactions.html)
- [Spring Data MongoDB - Repositories](https://docs.spring.io/spring-data/mongodb/reference/mongodb/repositories/repositories.html)
- [Spring Data MongoDB - Query Methods](https://docs.spring.io/spring-data/mongodb/reference/mongodb/repositories/query-methods.html)
- [Spring Data MongoDB - JSON/SpEL Queries](https://docs.spring.io/spring-data/mongodb/reference/mongodb/repositories/query-methods.html#mongodb.repositories.queries.json-spel)
