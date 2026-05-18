# 🚀 Guia de Conexão: AI Governance Hub (GitHub)

Escolha **UMA** das opções abaixo para conectar este Microserviço ao [**Hub de Governança (Branch Oficial)**](https://github.com/danielbissacot/ai-governance-hub/tree/hub-ia-arquitetura) em segundos.

---

### 🪄 Opção A: Pela Inteligência Artificial (Recomendado)

Copie o texto abaixo e cole no Chat da sua IDE (Antigravity ou Cursor). Ela fará toda a configuração, download e limpeza sozinha:

> **"Olá, Assistente de IA! Por favor, configure este microserviço para usar o AI Governance Hub com estes 3 passos: 1. No terminal, execute: `Remove-Item -Path agentes_foursys -Recurse -Force -ErrorAction SilentlyContinue; git clone --branch hub-ia-arquitetura --depth 1 https://github.com/danielbissacot/ai-governance-hub.git agentes_foursys; $m=@('======================================================================','                📖 MAPA DE ATIVOS: AI GOVERNANCE HUB','======================================================================','','Este arquivo ajuda voce a encontrar os Playbooks e Agentes certos.','DICA: Use o gatilho # no chat da sua IDE para chamar os arquivos.','','[!] CATEGORIAS DE ACESSO RAPIDO (PLAYBOOKS):','','Fase 0: ARQUITETURA E DESCOBERTA','--------------------------------','- #FASE0_DIAGRAMA_SEQUENCIA_ARQUITETURA.md','','Fase 1: REFINAMENTO (User Stories)','----------------------------------','- #FASE1_REFINAMENTO_NEGOCIO.md','','Fase 2: DESENHO TECNICO','-----------------------','- #FASE2_ESPECIFICACAO_TECNICA.md','','Fase 3: PORTOES DE QUALIDADE (Code Review e Testes)','---------------------------------------------------','- #FASE3_VALIDACAO_HEXAGONAL.md','- #FASE3_REVIEW_SPRING.md | #FASE3_REVIEW_ANGULAR.md','- #FASE3_TESTES_SPRING.md | #FASE3_TESTES_ANGULAR.md','','Fase 4: HOMOLOGACAO E ENTREGA','-----------------------------','- #FASE4_CHECKLIST_HOMOLOGACAO.md','','Fase 5: MODERNIZACAO LEGADO (COBOL)','-----------------------------------','- #FASE5_REVERSA_COMPLETA_COBOL.md','- #FASE5_DOCUMENTA_COBOL.md','','[+] AGENTES ESPECIALISTAS (PERSONAS):','-------------------------------------','- #AGENTE_SPRING_FOURSYS.md (Java/Hexagonal)','- #AGENTE_ANGULAR_FOURSYS.md (Front-end)','- #AGENTE_COBOL_FOURSYS.md (Mainframe)','- #AGENTE_NEGOCIO_FOURSYS.md (Refinamento)','','[*] AGENT SKILLS (HABILIDADES INTEGRADAS):','------------------------------------------','-> BACKEND (JAVA): Testing, Kafka, Feign Client, Rest Client.','-> FRONTEND (ANGULAR): Signals, Components, Forms, Routing.','','💡 EXEMPLO DE COMANDO NO CHAT:',' Ola #AGENTE_SPRING_FOURSYS.md, use sua skill de [KAFKA] seguindo',' os padroes de #FASE3_VALIDACAO_HEXAGONAL.md neste codigo.','','======================================================================','  Governança IA Foursys - Hub v1.0.0','======================================================================') -join [Environment]::NewLine; $m | Out-File -FilePath MAPA_DO_HUB.txt -Encoding utf8; code MAPA_DO_HUB.txt`. 2. ROBÔ GITHUB: Crie o arquivo `.github/workflows/hub-sync.yml` na raiz com o conteúdo oficial do Hub. 3. Me avise quando terminar para eu usar o `#`."**
>
> ```yaml
> name: Hub AI Sync
> 
> on:
>   push:
>     branches: [ main, master, develop ]
>   pull_request:
>     branches: [ main, master, develop ]
> 
> jobs:
>   validate-and-sync:
>     runs-on: ubuntu-latest
>     steps:
>       - name: Checkout code
>         uses: actions/checkout@v3
> 
>       - name: Security Check (agentes_foursys folder)
>         run: |
>           if [ -d "agentes_foursys" ]; then
>             echo "🛑 ERRO CRÍTICO! A pasta 'agentes_foursys' foi commitada no projeto."
>             echo "Remova-a do commit e use o .gitignore corretamente."
>             exit 1
>           fi
> 
>       - name: Sync AI Hub Rules
>         run: |
>           git clone --branch hub-ia-arquitetura --depth 1 https://github.com/danielbissacot/ai-governance-hub.git agentes_foursys
> 
>       - name: Upload Rules as Artifact
>         uses: actions/upload-artifact@v3
>         with:
>           name: agentes_foursys
>           path: agentes_foursys/
> ```
>
> 1. Me avise quando terminar para eu usar o `#`."**

---

### ⚡ Opção B: Pelo Terminal (Um Clique)

Se você prefere o terminal, copie e cole este comando (Windows) na raiz do seu projeto:

```powershell
Remove-Item -Path agentes_foursys -Recurse -Force -ErrorAction SilentlyContinue; git clone --branch hub-ia-arquitetura --depth 1 https://github.com/danielbissacot/ai-governance-hub.git agentes_foursys; $m=@('======================================================================','                📖 MAPA DE ATIVOS: AI GOVERNANCE HUB','======================================================================','','Este arquivo ajuda voce a encontrar os Playbooks e Agentes certos.','DICA: Use o gatilho # no chat da sua IDE para chamar os arquivos.','','[!] CATEGORIAS DE ACESSO RAPIDO (PLAYBOOKS):','','Fase 0: ARQUITETURA E DESCOBERTA','--------------------------------','- #FASE0_DIAGRAMA_SEQUENCIA_ARQUITETURA.md','','Fase 1: REFINAMENTO (User Stories)','----------------------------------','- #FASE1_REFINAMENTO_NEGOCIO.md','','Fase 2: DESENHO TECNICO','-----------------------','- #FASE2_ESPECIFICACAO_TECNICA.md','','Fase 3: PORTOES DE QUALIDADE (Code Review e Testes)','---------------------------------------------------','- #FASE3_VALIDACAO_HEXAGONAL.md','- #FASE3_REVIEW_SPRING.md | #FASE3_REVIEW_ANGULAR.md','- #FASE3_TESTES_SPRING.md | #FASE3_TESTES_ANGULAR.md','','Fase 4: HOMOLOGACAO E ENTREGA','-----------------------------','- #FASE4_CHECKLIST_HOMOLOGACAO.md','','Fase 5: MODERNIZACAO LEGADO (COBOL)','-----------------------------------','- #FASE5_REVERSA_COMPLETA_COBOL.md','- #FASE5_DOCUMENTA_COBOL.md','','[+] AGENTES ESPECIALISTAS (PERSONAS):','-------------------------------------','- #AGENTE_SPRING_FOURSYS.md (Java/Hexagonal)','- #AGENTE_ANGULAR_FOURSYS.md (Front-end)','- #AGENTE_COBOL_FOURSYS.md (Mainframe)','- #AGENTE_NEGOCIO_FOURSYS.md (Refinamento)','','[*] AGENT SKILLS (HABILIDADES INTEGRADAS):','------------------------------------------','-> BACKEND (JAVA): Testing, Kafka, Feign Client, Rest Client.','-> FRONTEND (ANGULAR): Signals, Components, Forms, Routing.','','💡 EXEMPLO DE COMANDO NO CHAT:',' Ola #AGENTE_SPRING_FOURSYS.md, use sua skill de [KAFKA] seguindo',' os padroes de #FASE3_VALIDACAO_HEXAGONAL.md neste codigo.','','======================================================================','  Governança IA Foursys - Hub v1.0.0','======================================================================') -join [Environment]::NewLine; $m | Out-File -FilePath MAPA_DO_HUB.txt -Encoding utf8; code MAPA_DO_HUB.txt; echo "✅ Hub Conectado com Sucesso!"
```

---

### 🛠️ O que foi configurado?

* **Pasta `agentes_foursys/`**: Contém todos os prompts. A pasta sendo um clone direto garante que a IA indexe os arquivos, mesmo que você a inclua no `.gitignore`.
* **Uso no Chat**: Agora você pode usar o **`#`** e começar a digitar o nome de qualquer prompt (ex: `#HEXAGONAL-JAVA`).
* **Mapa de Ativos (`MAPA_DO_HUB.txt`)**: Um arquivo gerado automaticamente com o índice de todos os prompts disponíveis para facilitar a sua navegação.
* **Segurança**: A trava de segurança contra commits da `agentes_foursys` é garantida automaticamente pelo GitHub Actions. Você pode (e deve) ignorá-la no `.gitignore`.

---

### 🛡️ Nota para Gestores

As regras do Hub são centralizadas e imutáveis por este microserviço, garantindo a governança global através do repositório oficial no GitHub.
