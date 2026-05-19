---
name: springboot-rest-client
description: Implementa chamadas HTTP síncronas usando RestClient em projetos Spring Boot. Use quando precisar realizar chamadas REST imperativas, configurar timeouts, interceptors, e tratamento de erros seguindo as melhores práticas de arquitetura.
metadata:
  version: "0.0.1"
---

# Spring Boot RestClient

Este skill fornece instruções detalhadas para implementar chamadas HTTP síncronas usando RestClient, a API moderna e fluente do Spring Boot que substitui o RestTemplate.

## Quando usar este skill

Use este skill quando:
- Precisar realizar chamadas HTTP síncronas em aplicações não-reativas
- Migrar de RestTemplate para a API moderna RestClient
- Configurar pool de conexões e timeouts otimizados
- Implementar interceptors para logs e tratamento de erros
- Seguir padrões de resiliência e boas práticas de arquitetura

**⚠️ IMPORTANTE**: 
- Para aplicações **reativas**, use `WebClient` ao invés de `RestClient`
- Para **integrações declarativas** com APIs externas, considere usar o [springboot-feign-client skill](../SPRINGBOOT_FEIGN_CLIENT/SKILL_SPRINGBOOT_FEIGN_CLIENT.MD)

## Comparação: RestClient vs Feign Client

| Aspecto | RestClient | Feign Client |
|---------|-----------|--------------|
| **Estilo** | Programático/Fluente | Declarativo/Anotações |
| **Uso recomendado** | Chamadas HTTP flexíveis e ad-hoc | Integrações estruturadas com APIs |
| **Configuração** | Por instância (builder) | Global + por client |
| **Circuit Breaker** | Manual (Resilience4j) | Integrado (fallback nativo) |
| **Código** | Mais verboso | Menos código |
| **Flexibilidade** | Muito alta | Média |

**Escolha RestClient quando**: Precisa de controle fino sobre requisições, URLs dinâmicas, ou chamadas pontuais.
**Escolha Feign quando**: Integração bem definida, contrato de API estável, múltiplos endpoints da mesma API.

## Dependências necessárias

RestClient está disponível no Spring Boot 3.2+. Adicione as dependências no `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Cliente HTTP recomendado: Apache HttpClient 5 -->
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
</dependency>

<!-- Opcional: para métricas e observabilidade -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Opcional: para Circuit Breaker -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.1.0</version>
</dependency>
```

## Estrutura recomendada

### Arquitetura Hexagonal (Recomendada)

```text
com.empresa.projeto/
├── core/
│   ├── domain/model/
│   │   └── Usuario.java                     # Entidade de domínio
│   └── usecase/
│       └── BuscarUsuarioPorCpfUseCase.java  # Lógica de negócio
├── port/
│   ├── input/
│   │   └── BuscarUsuarioPorCpfInputPort.java    # Contrato de entrada
│   └── output/
│       └── UsuarioApiOutputPort.java            # Contrato de saída
└── adapter/
    ├── input/
    │   └── controller/
    │       ├── UsuarioController.java
    │       ├── mapper/
    │       │   └── UsuarioControllerMapper.java # Mapper controller
    │       └── dto/
    │           └── response/
    │               └── UsuarioControllerResponse.java
    └── output/
        ├── client/
        │   ├── UsuarioApiClient.java            # Implementa OutputPort
        │   ├── dto/
        │   │   ├── request/
        │   │   │   └── UsuarioApiRequest.java   # DTO da API externa
        │   │   └── response/
        │   │       └── UsuarioApiResponse.java  # DTO da API externa
        │   └── mapper/
        │       └── UsuarioApiMapper.java        # ACL - Anti-Corruption Layer
        └── config/
            └── RestClientConfig.java            # Configuração do RestClient
```

## Passo 1: Configuração do RestClient

### Configuração Base com Pool de Conexões

Crie a classe de configuração em `adapter/config/`:

```java
package com.empresa.projeto.adapter.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.core5.http.io.SocketConfig;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Configuração do RestClient com pool de conexões otimizado
 * Baseado nas diretrizes de performance corporativas
 */
@Slf4j
@Configuration
public class RestClientConfig {

    @Value("${app.http.client.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${app.http.client.read-timeout:30000}")
    private int readTimeout;

    @Value("${app.http.client.pool.max-total:200}")
    private int maxTotal;

    @Value("${app.http.client.pool.max-per-route:50}")
    private int maxPerRoute;

    /**
     * Cria ClientHttpRequestFactory com Apache HttpClient 5 e pool de conexões
     */
    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        PoolingHttpClientConnectionManager connectionManager =
            PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnTotal(maxTotal)
                .setMaxConnPerRoute(maxPerRoute)
                .setDefaultSocketConfig(SocketConfig.custom()
                    .setSoTimeout(Timeout.ofMilliseconds(readTimeout))
                    .build())
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
            .setConnectionManager(connectionManager)
            .setDefaultRequestConfig(RequestConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(connectTimeout))
                .setResponseTimeout(Timeout.ofMilliseconds(readTimeout))
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(2000))
                .build())
            .evictIdleConnections(Timeout.ofMinutes(5))
            .build();

        return new HttpComponentsClientHttpRequestFactory(httpClient);
    }

    /**
     * RestClient.Builder default para injeção
     */
    @Bean
    public RestClient.Builder restClientBuilder(ClientHttpRequestFactory requestFactory) {
        return RestClient.builder()
            .requestFactory(requestFactory)
            .requestInterceptor((request, body, execution) -> {
                log.info("RestClient request: {} {}", request.getMethod(), request.getURI());
                long start = System.currentTimeMillis();
                var response = execution.execute(request, body);
                long duration = System.currentTimeMillis() - start;
                log.info("RestClient response: {} in {}ms", response.getStatusCode(), duration);
                return response;
            });
    }
}
```

## Passo 2: Configurações por Ambiente

As configurações devem ser ajustadas conforme o ambiente:

### Desenvolvimento / Teste (`application-dev.yml`)

```yaml
app:
  http:
    client:
      connect-timeout: 15000
      read-timeout: 60000
      pool:
        max-total: 50
        max-per-route: 10
```

### Produção (`application-prod.yml`)

```yaml
app:
  http:
    client:
      connect-timeout: 3000
      read-timeout: 15000
      pool:
        max-total: 500
        max-per-route: 100

resilience4j:
  circuitbreaker:
    instances:
      usuario-api:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        failureRateThreshold: 50
        waitDurationInOpenState: 10s
```

## Passo 3: Criar DTOs

Crie os DTOs em `adapter/output/client/dto/`:

```java
package com.empresa.projeto.adapter.output.client.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioApiResponse {
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("cpf")
    private String cpf;
    
    @JsonProperty("nome")
    private String nome;
}
```

## Passo 4: Criar Client que Encapsula RestClient

```java
package com.empresa.projeto.adapter.output.client;

import com.empresa.projeto.adapter.output.client.dto.response.UsuarioApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class UsuarioApiClient {

    private final RestClient restClient;

    public UsuarioApiClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.usuario-api.url}") String baseUrl) {
        
        this.restClient = restClientBuilder
            .baseUrl(baseUrl)
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    public UsuarioApiResponse buscarPorCpf(String cpf) {
        return restClient.get()
            .uri("/api/v1/usuarios/{cpf}", cpf)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                // REGRA: use exceção de domínio — nunca RuntimeException genérico
                throw new UsuarioNaoEncontradoException(cpf);
            })
            .onStatus(HttpStatusCode::is5xxServerError, (request, response) -> {
                // REGRA: 5xx sempre tratado explicitamente com exceção de indisponibilidade
                throw new ServicoExternoIndisponivelException("usuario-api");
            })
            .body(UsuarioApiResponse.class);
    }
}
```

## Boas Práticas

1. **✅ Use RestClient.Builder injetado**: Aproveite a auto-configuração do Spring Boot.
2. **✅ Configure pool de conexões**: Use Apache HttpClient 5.
3. **✅ Encapsule em clients**: Crie classes client dedicadas em `adapter/output/client`.
4. **✅ Use DTOs específicos**: Não use entidades de domínio para comunicação HTTP.
5. **✅ Configure resiliência com Resilience4j**: Use os thresholds mínimos abaixo como baseline — nunca suba para produção sem circuit breaker configurado:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      usuario-api:
        slidingWindowSize: 10           # mínimo obrigatório
        failureRateThreshold: 50        # abre o circuito com 50% de falhas
        waitDurationInOpenState: 10s    # tempo mínimo em estado aberto
        minimumNumberOfCalls: 5
  retry:
    instances:
      usuario-api:
        maxAttempts: 3
        waitDuration: 500ms
```

6. **✅ Trate 4xx e 5xx explicitamente**: Use `onStatus()` para ambos os grupos — veja exemplo no Passo 4.
7. **✅ Use exceções de domínio**: Nunca use `RuntimeException` genérico nos handlers de status.

## Referências

- [Spring Boot RestClient Documentation](https://docs.spring.io/spring-boot/reference/io/rest-client.html)
- [Spring Boot Feign Client Skill](../SPRINGBOOT_FEIGN_CLIENT/SKILL_SPRINGBOOT_FEIGN_CLIENT.MD)

