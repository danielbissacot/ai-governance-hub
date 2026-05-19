---
name: springboot-feign-client
description: Implementa integrações REST usando OpenFeign em projetos Spring Boot com arquitetura hexagonal. Use quando precisar criar clients HTTP declarativos, configurar circuit breakers, fallbacks, ou integrar com APIs REST externas seguindo padrões de resiliência.
metadata:
  version: "0.0.1"
---

# Spring Boot Feign Client

Este skill fornece instruções detalhadas para implementar integrações REST usando OpenFeign em projetos Spring Boot seguindo arquitetura hexagonal e padrões de resiliência.

## Quando usar este skill

Use este skill quando:
- Precisar integrar com APIs REST externas
- Implementar clients HTTP declarativos
- Configurar estratégias de fallback e circuit breaker
- Seguir arquitetura hexagonal com anti-corruption layer (ACL)
- Implementar resiliência em chamadas HTTP

## Dependências necessárias

Adicione as seguintes dependências no `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>

<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-httpclient5</artifactId>
</dependency>

<!-- MapStruct para mapeamento de objetos -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>

<!-- Opcional: para fallback com Circuit Breaker -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
```

## Estrutura na Arquitetura em camadas / MVC

Para integrações com APIs externas usando Feign em arquitetura em camadas ou MVC consulte [references/MVC_FEIGN_INTEGRATION.md](REFERENCES/MVC_FEIGN_INTEGRATION.MD) para estrutura detalhada com exemplos

## Estrutura na Arquitetura Hexagonal

Para integrações com APIs externas usando Feign em arquitetura hexagonal, siga os princípios de isolamento entre camadas:

- **OutputPort** (`port/output/`): Define contratos em linguagem de domínio
- **Adapter** (`adapter/output/client/`): Implementa OutputPort usando Feign
- **FeignClient** (`adapter/output/client/`): Interface declarativa HTTP
- **Mapper/ACL** (`adapter/output/client/mapper/`): Traduz entre API externa e domínio
- **DTOs** (`adapter/output/client/dto/`): Estruturas da API externa

**📖 Consulte**: [references/HEXAGONAL_FEIGN_INTEGRATION.md](REFERENCES/HEXAGONAL_FEIGN_INTEGRATION.MD) para estrutura detalhada com exemplos

## Passo 1: Configuração do Feign Client

Crie a classe de configuração em `config/`:

```java
package com.empresa.projeto.adapter.config;

import feign.Client;
import feign.Contract;
import feign.Retryer;
import feign.codec.Decoder;
import feign.codec.Encoder;
import feign.httpclient5.ApacheHttp5Client;
import feign.jackson.JacksonDecoder;
import feign.jackson.JacksonEncoder;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.http.io.SocketConfig;
import org.apache.hc.core5.util.Timeout;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.openfeign.support.SpringMvcContract;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
@EnableFeignClients(basePackages = "com.empresa.projeto.adapter.output.client")
public class FeignClientConfig {

    @Bean
    @ConditionalOnProperty(name = "app.http.client.type", havingValue = "feign", matchIfMissing = true)
    public Client feignHttpClient5() {
        // Pool de conexões HTTP/2
        PoolingHttpClientConnectionManager connectionManager =
            PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnTotal(500)
                .setMaxConnPerRoute(100)
                .setDefaultSocketConfig(SocketConfig.custom()
                    .setSoTimeout(Timeout.ofSeconds(30))
                    .build())
                .build();

        // Cliente HTTP 5 com configurações avançadas
        CloseableHttpClient httpClient = HttpClients.custom()
            .setConnectionManager(connectionManager)
            .setDefaultRequestConfig(RequestConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(5))
                .setResponseTimeout(Timeout.ofSeconds(30))
                .setConnectionRequestTimeout(Timeout.ofSeconds(2))
                .build())
            .addRequestInterceptorFirst((request, entity, context) -> {
                log.info("Feign request: {} {}", request.getMethod(), request.getRequestUri());
            })
            .addResponseInterceptorLast((response, entity, context) -> {
                log.info("Feign response: {}", response.getCode());
            })
            .evictIdleConnections(5L, TimeUnit.MINUTES)
            .build();

        return new ApacheHttp5Client(httpClient);
    }

    @Bean
    public Contract feignContract() {
        return new SpringMvcContract();
    }

    @Bean
    public Decoder feignDecoder() {
        return new JacksonDecoder();
    }

    @Bean
    public Encoder feignEncoder() {
        return new JacksonEncoder();
    }

    @Bean
    public Retryer feignRetryer() {
        // Retry: 3 tentativas, começando com 500ms e aumentando até 2000ms
        return new Retryer.Default(500, 2000, 3);
    }
}

// REGRA: O Bean feignRetryer() acima é o retry padrão para todos os ambientes.
// NÃO referencie classes CustomRetryer externas sem fornecer a implementação completa nesta skill.
```

**Propriedades no application.yml:**

As configurações devem ser ajustadas conforme o ambiente:

### Desenvolvimento / Teste (application-dev.yml)

```yaml
app:
  http:
    client:
      type: feign

  usuario-api:
    url: ${USUARIO_API_URL:http://localhost:8081}

feign:
  client:
    config:
      default:
        connectTimeout: 15000
        readTimeout: 60000
        loggerLevel: full
  httpclient:
    enabled: true
    max-connections: 50
    max-connections-per-route: 10
```

### Teste de Carga (application-loadtest.yml)

```yaml
app:
  usuario-api:
    url: ${USUARIO_API_URL}

feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 30000
        loggerLevel: basic
  httpclient:
    enabled: true
    max-connections: 200
    max-connections-per-route: 50
    connection-timer-repeat: 30000
```

### Produção (application-prod.yml)

```yaml
app:
  usuario-api:
    url: ${USUARIO_API_URL}

feign:
  client:
    config:
      default:
        connectTimeout: 3000
        readTimeout: 15000
        loggerLevel: none
  httpclient:
    enabled: true
    max-connections: 500
    max-connections-per-route: 100
    connection-timer-repeat: 30000
  circuitbreaker:
    enabled: true
```

## Regra: Mapper ACL com MapStruct (obrigatório)

O mapper que traduz entre DTOs da API externa e objetos de domínio **deve sempre usar MapStruct**. Conversões manuais são proibidas.

```java
package com.empresa.projeto.adapter.output.client.mapper;

import com.empresa.projeto.core.domain.model.Usuario;
import com.empresa.projeto.adapter.output.client.dto.response.UsuarioApiResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UsuarioApiMapper {

    @Mapping(source = "nomeCompleto", target = "nome")
    Usuario toDomain(UsuarioApiResponse response);
}
```

**Regras do Mapper:**
- Sempre use `@Mapper(componentModel = "spring")` para injeção via Spring
- Campos com nomes diferentes entre API e domínio devem ter `@Mapping` explícito
- Nunca passe objetos de domínio diretamente para o FeignClient — sempre mapeie primeiro

## Passo 2: Criar DTOs da API Externa

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
    
    @JsonProperty("nome_completo")  // Campo diferente do domínio
    private String nomeCompleto;
    
    @JsonProperty("email")
    private String email;
}
```

```java
package com.empresa.projeto.adapter.output.client.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriarUsuarioRequest {
    
    @JsonProperty("cpf")
    private String cpf;
    
    @JsonProperty("nome_completo")
    private String nomeCompleto;
    
    @JsonProperty("email")
    private String email;
}
```

## Passo 3: Criar a Interface Feign (FeignClient)

```java
package com.empresa.projeto.adapter.output.client;

import com.empresa.projeto.adapter.output.client.dto.request.CriarUsuarioRequest;
import com.empresa.projeto.adapter.output.client.dto.response.UsuarioApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Interface Feign Client para API de usuários
 * Usa DTOs da API externa (não de domínio)
 */
@FeignClient(
    name = "usuario-api",
    url = "${app.usuario-api.url}",
    configuration = FeignClientConfig.class,
    fallback = UsuarioApiFallback.class  // Opcional: estratégia de fallback
)
public interface UsuarioApiFeignClient {
    
    @GetMapping("/api/v1/usuarios/{cpf}")
    UsuarioApiResponse buscarPorCpf(@PathVariable("cpf") String cpf);
    
    @PostMapping("/api/v1/usuarios")
    UsuarioApiResponse criar(@RequestBody CriarUsuarioRequest request);
}
```

## Estratégia de Fallback (Opcional)

**⚠️ IMPORTANTE**: Só implemente fallback se previamente alinhado com o usuário ou especificado nos requisitos.

### Quando usar fallback:
- APIs com instabilidade conhecida
- Necessidade de degradação graciosa
- Cache ou dados default são aceitáveis
- Alinhado com requisitos de negócio

### Implementação do Fallback:

```java
package com.empresa.projeto.adapter.output.client;

import com.empresa.projeto.adapter.output.client.dto.request.CriarUsuarioRequest;
import com.empresa.projeto.adapter.output.client.dto.response.UsuarioApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Fallback para UsuarioApiFeignClient
 * Retorna respostas padrão quando a API falha
 */
@Slf4j
@Component
public class UsuarioApiFallback implements UsuarioApiFeignClient {
    
    @Override
    public UsuarioApiResponse buscarPorCpf(String cpf) {
        log.warn("Fallback acionado para buscarPorCpf: {}", cpf);
        // REGRA: Fallback NUNCA retorna null. Lance exceção de domínio ou retorne Optional.empty().
        throw new ServicoExternoIndisponivelException("usuario-api", "buscarPorCpf");
    }
    
    @Override
    public UsuarioApiResponse criar(CriarUsuarioRequest request) {
        log.warn("Fallback acionado para criar usuário: {}", request.getCpf());
        // REGRA: Fallback NUNCA retorna null. Lance exceção de domínio com contexto.
        throw new ServicoExternoIndisponivelException("usuario-api", "criar");
    }
}
```

### Configurar Circuit Breaker com Resilience4j:

O Circuit Breaker deve ser habilitado em **produção** (veja configuração acima).

Adicione a configuração do Resilience4j no `application-prod.yml`:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      usuario-api:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
        eventConsumerBufferSize: 10
  timelimiter:
    instances:
      usuario-api:
        timeoutDuration: 15s

feign:
  circuitbreaker:
    enabled: true
```

## Tratamento de Erros

**REGRA**: Toda `FeignException` deve ser capturada e relançada como exceção de domínio. Nunca retorne `null` nem engula a exceção silenciosamente.

### Exceções comuns do Feign — ação obrigatória por status:

```java
try {
    // chamada Feign
} catch (FeignException.NotFound e) {
    // 404 - Recurso não encontrado: lance exceção de domínio específica
    throw new UsuarioNaoEncontradoException(cpf, e);
} catch (FeignException.BadRequest e) {
    // 400 - Dado inválido enviado: lance exceção de validação de domínio
    throw new RequisicaoInvalidaException("usuario-api", e.getMessage(), e);
} catch (FeignException.Unauthorized | FeignException.Forbidden e) {
    // 401/403 - Problema de autenticação/autorização: lance exceção de segurança
    throw new AcessoNegadoException("usuario-api", e);
} catch (FeignException.InternalServerError e) {
    // 500 - Falha no servidor externo: lance exceção de indisponibilidade
    throw new ServicoExternoIndisponivelException("usuario-api", e);
} catch (FeignException e) {
    // Outros erros HTTP inesperados: sempre relance com contexto
    throw new ServicoExternoIndisponivelException("usuario-api", e);
}
```

### Error Decoder customizado (opcional):

```java
package com.empresa.projeto.adapter.output.config;

import feign.Response;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignErrorConfig {
    
    @Bean
    public ErrorDecoder errorDecoder() {
        return new CustomErrorDecoder();
    }
    
    static class CustomErrorDecoder implements ErrorDecoder {
        private final ErrorDecoder defaultDecoder = new Default();
        
        @Override
        public Exception decode(String methodKey, Response response) {
            switch (response.status()) {
                case 404:
                    return new RuntimeException("Recurso não encontrado");
                case 503:
                    return new RuntimeException("Serviço temporariamente indisponível");
                default:
                    return defaultDecoder.decode(methodKey, response);
            }
        }
    }
}
```

