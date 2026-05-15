# 🚀 Guia de Conexão: Foursys SDD Engine (Maestro)

Este guia configura o ambiente para o novo **Motor de Spec-Driven Development (SDD)** da Foursys.

---

### 1. Conectar o Microserviço ao Hub (SDD Edition)

Copie e cole o comando abaixo no terminal do seu projeto. Ele vai baixar o catálogo oficial da branch **`ai-governance-plugin`**:

```powershell
Remove-Item -Path agentes_foursys -Recurse -Force -ErrorAction SilentlyContinue; 
git clone --branch ai-governance-plugin --depth 1 https://github.com/danielbissacot/ai-governance-hub.git agentes_foursys;
Write-Host "✅ Catálogo SDD baixado com sucesso!" -ForegroundColor Cyan
```

### 2. Configurar o Motor no VS Code

1. Abra o VS Code no seu projeto.
2. Certifique-se de ter instalado o plugin `foursys-sdd-engine-0.1.1.vsix`.
3. Abra a barra lateral **Foursys SDD**.
4. Clique em **"0. Constitution"**.
5. Quando o VS Code pedir para selecionar a pasta, escolha: 
   `[Seu Projeto]/agentes_foursys/catalog`

---

### 📖 Mapa de Ativos SDD (Maestro)

Agora você tem acesso às fases automatizadas:

| Fase | Arquivo de Referência (no Hub) | Objetivo |
| :--- | :--- | :--- |
| **0. Constitution** | `playbook/sdd/foursys-constitution.md` | Regras de ouro e padrões. |
| **1. Specify** | `playbook/fase1_refinamento_negocio/...` | Refinamento da User Story. |
| **2. Plan** | `playbook/fase2_desenho_tecnico/...` | Desenho técnico e arquitetura. |
| **3. Tasks** | `playbook/sdd/foursys-tasks.md` | Checklist atômico de execução. |
| **4. Implement** | `agents_skills/...` | Codificação física automática. |

---
© 2026 Foursys - Engenharia de Valor | Hub v1.1.0 (SDD Edition)
