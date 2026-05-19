---
name: springboot-kafka
description: Use para implementar producers ou consumers do Apache Kafka em projetos Spring Boot usando Confluent Cloud. Use quando precisar implementar streaming de dados, mensageria assíncrona, event-driven architecture, ou integração com tópicos Kafka seguindo padrões de resiliência e retry.
metadata:
  version: "0.0.1"
---

# Spring Boot Kafka

Este skill fornece instruções detalhadas para implementar producers e consumers do Apache Kafka em projetos Spring Boot usando Confluent Cloud seguindo arquitetura hexagonal e padrões de resiliência.

## Quando usar este skill

Use este skill quando:
- Precisar produzir eventos para tópicos Kafka
- Implementar consumidores de mensagens Kafka
- Configurar estratégias de retry e Dead-Letter Topics (DLT)
- Seguir arquitetura hexagonal com event-driven architecture
- Implementar resiliência em processamento de mensagens
- Integrar com Confluent Cloud (plataforma Kafka gerenciada da empresa)

## Pré-Requisitos

- **JDK 21** (obrigatório, alinhado com AGENTE_SPRING_FOURSYS)
- **Maven**
- **Spring Boot 3.x.x**

## Dependências necessárias

Adicione a seguinte dependência no `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

## Estrutura na Arquitetura Hexagonal

Para implementação de Producers e Consumers Kafka em arquitetura hexagonal, siga os princípios de isolamento entre camadas:

### Producer (Output)
- **OutputPort** (`port/output/`): Define contratos em linguagem de domínio para envio de eventos
- **Producer Adapter** (`adapter/output/kafka/producer/`): Implementa OutputPort usando Kafka Producer
- **Event DTOs** (`adapter/output/kafka/producer/dto/`): Estruturas de mensagens Kafka
- **Mapper** (`adapter/output/kafka/producer/mapper/`): Traduz entre domínio e eventos Kafka

**📖 Consulte**: [references/KAFKA_PRODUCER_INTEGRATION.md](REFERENCES/KAFKA_PRODUCER_INTEGRATION.MD) para estrutura detalhada com exemplos

### Consumer (Input)
- **InputPort** (`port/input/`): Define casos de uso que processam mensagens
- **Consumer Adapter** (`adapter/input/kafka/consumer/`): Escuta tópicos e processa mensagens
- **Event DTOs** (`adapter/input/kafka/consumer/dto/`): Estruturas de mensagens recebidas
- **Mapper** (`adapter/input/kafka/consumer/mapper/`): Traduz eventos Kafka para domínio

**📖 Consulte**: [references/KAFKA_CONSUMER_INTEGRATION.md](REFERENCES/KAFKA_CONSUMER_INTEGRATION.MD) para estrutura detalhada com exemplos

## Configuração do Kafka (application.yml)

```yaml
spring:
  kafka:
    bootstrap-servers: '${MY_KAFKA_BOOTSTRAP_SERVERS}'
    security:
      protocol: SASL_SSL
    properties:
      sasl:
        mechanism: PLAIN
        jaas:
          config: 'org.apache.kafka.common.security.plain.PlainLoginModule required username="${MY_KAFKA_USERNAME}" password="${MY_KAFKA_PASSWORD}";'
```

## Regras Obrigatórias de Configuração

### Producer — Configuração mínima obrigatória

Adicione no `application.yml`:

```yaml
spring:
  kafka:
    producer:
      acks: all                          # Garante durabilidade — nunca use acks: 0 ou acks: 1 em produção
      retries: 3
      properties:
        enable.idempotence: true         # Evita duplicatas em retry
        max.in.flight.requests.per.connection: 1
```

### Consumer — Configuração mínima obrigatória

```yaml
spring:
  kafka:
    consumer:
      group-id: ${KAFKA_CONSUMER_GROUP_ID}   # Sempre via variável de ambiente — nunca hardcoded
      auto-offset-reset: earliest
      enable-auto-commit: false              # Commit manual obrigatório — evita perda de mensagens
```

### Retry e Dead-Letter Topic (DLT) — Obrigatório em consumers de negócio

Use `@RetryableTopic` para configurar retry com backoff e DLT automático:

```java
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 1000, multiplier = 2.0),
    dltTopicSuffix = ".DLT"   // Tópico DLT recebe sufixo .DLT obrigatoriamente
)
@KafkaListener(topics = "${kafka.topic.nome}")
public void consumir(MinhaEvent evento) {
    // lógica de negócio
}
```

**Regras DLT:**
- O sufixo do tópico DLT deve ser sempre `.DLT` (ex: `pedidos.criados.DLT`)
- O consumer **não deve fazer `ack` manual** em caso de exceção de negócio — deixe o retry tratar
- Exceções de infraestrutura (timeout, conexão) devem ser lançadas para acionar retry
- Exceções de negócio irrecuperáveis devem ser capturadas e o evento enviado ao DLT manualmente

## Problemas Conhecidos

### Erro: SslAuthenticationException / SSLHandshakeException
**Causa**: Certificado root do Kafka não está no truststore.
**Solução**: Importe o certificado **ISRG Root X1** com o comando abaixo:

```bash
keytool -importcert \
  -alias isrg-root-x1 \
  -file isrg-root-x1.pem \
  -keystore $JAVA_HOME/lib/security/cacerts \
  -storepass changeit \
  -noprompt
```

Obtenha o arquivo `isrg-root-x1.pem` em: https://letsencrypt.org/certs/isrgrootx1.pem

## Referências Completas

- **[KAFKA_PRODUCER_INTEGRATION.md](REFERENCES/KAFKA_PRODUCER_INTEGRATION.MD)** - Implementação completa de Kafka Producer
- **[KAFKA_CONSUMER_INTEGRATION.md](REFERENCES/KAFKA_CONSUMER_INTEGRATION.MD)** - Implementação completa de Kafka Consumer

