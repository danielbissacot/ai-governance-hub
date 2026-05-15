import * as fs from 'fs';
import * as path from 'path';

/**
 * Carrega o conteúdo de um arquivo .md do catálogo, removendo o Frontmatter YAML.
 * @param filePath Caminho absoluto para o arquivo .md
 * @returns O corpo do prompt (sem o bloco --- ... ---)
 */
export function loadPlaybook(filePath: string): string {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Playbook não encontrado: ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');

    // Remove Frontmatter YAML (bloco entre --- e ---)
    const frontmatterRegex = /^---[\s\S]*?---\s*/;
    return raw.replace(frontmatterRegex, '').trim();
}

/**
 * Detecta a tecnologia informada pelo usuário no arquivo user_story.md.
 * Procura pelo campo **Tecnologia**: no corpo do arquivo.
 * @param userStoryPath Caminho absoluto para o user_story.md
 * @returns Nome da tecnologia detectada (ex: "Angular", "Java", "COBOL") ou null
 */
export function detectTechnology(userStoryPath: string): string | null {
    if (!fs.existsSync(userStoryPath)) {
        return null;
    }

    const content = fs.readFileSync(userStoryPath, 'utf8');

    // Regex mais flexível para capturar o valor após "Tecnologia"
    const techHeaderRegex = /Tecnologia\s*[:\-]\s*([^\r\n]*)/i;
    const match = content.match(techHeaderRegex);
    
    let techToAnalyze = "";
    if (match && match[1]) {
        techToAnalyze = match[1].toLowerCase();
    } else {
        // Fallback: Analisa o arquivo inteiro se não achar o rótulo
        techToAnalyze = content.toLowerCase();
    }

    // Limpeza profunda (remove colchetes, parênteses e o texto "informe")
    techToAnalyze = techToAnalyze.replace(/[\[\]\(\)]/g, '').replace(/informe[:\s]*/i, '').trim();
    
    // Mapeamento de palavras-chave
    if (techToAnalyze.includes('angular')) return 'angular';
    if (techToAnalyze.includes('java') || techToAnalyze.includes('spring')) return 'spring_boot';
    if (techToAnalyze.includes('cobol')) return 'cobol';
    
    return null;
}

/**
 * Busca o arquivo .md do Agente/Skill baseado na tecnologia detectada.
 * @param catalogPath Caminho absoluto para a pasta catalog/
 * @param technology Nome da tecnologia (ex: "angular", "spring_boot")
 * @returns Caminho absoluto para o arquivo do agente ou null
 */
export function findAgentSkill(catalogPath: string, technology: string): string | null {
    const agentMap: Record<string, string> = {
        'angular': 'agents_skills/angular/AGENTE_ANGULAR_FOURSYS.md',
        'spring_boot': 'agents_skills/spring_boot/AGENTE_SPRING_FOURSYS.md',
        'cobol': 'agents_skills/cobol/AGENTE_COBOL_FOURSYS.md',
    };

    const relativePath = agentMap[technology];
    if (!relativePath) return null;

    const fullPath = path.join(catalogPath, relativePath);
    return fs.existsSync(fullPath) ? fullPath : null;
}

/**
 * Busca o Playbook de Code Review baseado na tecnologia.
 */
export function findReviewPlaybook(catalogPath: string, technology: string): string | null {
    const reviewMap: Record<string, string> = {
        'angular': 'playbook/fase3_portoes_qualidade/FASE3_REVIEW_ANGULAR.md',
        'spring_boot': 'playbook/fase3_portoes_qualidade/FASE3_VALIDACAO_HEXAGONAL.md',
    };
    const relativePath = reviewMap[technology];
    if (!relativePath) return null;
    const fullPath = path.join(catalogPath, relativePath);
    return fs.existsSync(fullPath) ? fullPath : null;
}

/**
 * Busca o arquivo de testes baseado na tecnologia.
 */
export function findTestPlaybook(catalogPath: string, technology: string): string | null {
    const testMap: Record<string, string> = {
        'angular': 'playbook/fase3_portoes_qualidade/FASE3_TESTES_ANGULAR.md',
        'spring_boot': 'playbook/fase3_portoes_qualidade/FASE3_TESTES_SPRING.md',
    };
    const relativePath = testMap[technology];
    if (!relativePath) return null;
    const fullPath = path.join(catalogPath, relativePath);
    return fs.existsSync(fullPath) ? fullPath : null;
}

/**
 * Localiza a pasta catalog/ no workspace ou no globalStorage.
 * @param workspaceRoot Raiz do workspace
 * @param globalStoragePath Caminho do globalStorage da extensão
 * @returns Caminho absoluto para a pasta catalog/ ou null
 */
export function findCatalogPath(workspaceRoot: string, globalStoragePath: string): string | null {
    // 1. Procura catalog/ direto no workspace (ex: abrindo o próprio ai-governance-hub)
    const localCatalog = path.join(workspaceRoot, 'catalog');
    if (fs.existsSync(localCatalog)) return localCatalog;

    // 2. Procura na pasta agentes_foursys clonada na raiz do workspace (processo do Manual)
    const workspaceCatalog = path.join(workspaceRoot, 'agentes_foursys', 'catalog');
    if (fs.existsSync(workspaceCatalog)) return workspaceCatalog;

    // 3. Fallback: globalStorage (caso antigo)
    const globalCatalog = path.join(globalStoragePath, 'agentes_foursys', 'catalog');
    if (fs.existsSync(globalCatalog)) return globalCatalog;

    return null;
}
