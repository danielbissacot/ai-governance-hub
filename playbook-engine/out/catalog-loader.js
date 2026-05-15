"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPlaybook = loadPlaybook;
exports.detectTechnology = detectTechnology;
exports.findAgentSkill = findAgentSkill;
exports.findReviewPlaybook = findReviewPlaybook;
exports.findTestPlaybook = findTestPlaybook;
exports.findCatalogPath = findCatalogPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Carrega o conteúdo de um arquivo .md do catálogo, removendo o Frontmatter YAML.
 * @param filePath Caminho absoluto para o arquivo .md
 * @returns O corpo do prompt (sem o bloco --- ... ---)
 */
function loadPlaybook(filePath) {
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
function detectTechnology(userStoryPath) {
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
    }
    else {
        // Fallback: Analisa o arquivo inteiro se não achar o rótulo
        techToAnalyze = content.toLowerCase();
    }
    // Limpeza profunda (remove colchetes, parênteses e o texto "informe")
    techToAnalyze = techToAnalyze.replace(/[\[\]\(\)]/g, '').replace(/informe[:\s]*/i, '').trim();
    // Mapeamento de palavras-chave
    if (techToAnalyze.includes('angular'))
        return 'angular';
    if (techToAnalyze.includes('java') || techToAnalyze.includes('spring'))
        return 'spring_boot';
    if (techToAnalyze.includes('cobol'))
        return 'cobol';
    return null;
}
/**
 * Busca o arquivo .md do Agente/Skill baseado na tecnologia detectada.
 * @param catalogPath Caminho absoluto para a pasta catalog/
 * @param technology Nome da tecnologia (ex: "angular", "spring_boot")
 * @returns Caminho absoluto para o arquivo do agente ou null
 */
function findAgentSkill(catalogPath, technology) {
    const agentMap = {
        'angular': 'agents_skills/angular/AGENTE_ANGULAR_FOURSYS.md',
        'spring_boot': 'agents_skills/spring_boot/AGENTE_SPRING_FOURSYS.md',
        'cobol': 'agents_skills/cobol/AGENTE_COBOL_FOURSYS.md',
    };
    const relativePath = agentMap[technology];
    if (!relativePath)
        return null;
    const fullPath = path.join(catalogPath, relativePath);
    return fs.existsSync(fullPath) ? fullPath : null;
}
/**
 * Busca o Playbook de Code Review baseado na tecnologia.
 */
function findReviewPlaybook(catalogPath, technology) {
    const reviewMap = {
        'angular': 'playbook/fase3_portoes_qualidade/FASE3_REVIEW_ANGULAR.md',
        'spring_boot': 'playbook/fase3_portoes_qualidade/FASE3_VALIDACAO_HEXAGONAL.md',
    };
    const relativePath = reviewMap[technology];
    if (!relativePath)
        return null;
    const fullPath = path.join(catalogPath, relativePath);
    return fs.existsSync(fullPath) ? fullPath : null;
}
/**
 * Busca o arquivo de testes baseado na tecnologia.
 */
function findTestPlaybook(catalogPath, technology) {
    const testMap = {
        'angular': 'playbook/fase3_portoes_qualidade/FASE3_TESTES_ANGULAR.md',
        'spring_boot': 'playbook/fase3_portoes_qualidade/FASE3_TESTES_SPRING.md',
    };
    const relativePath = testMap[technology];
    if (!relativePath)
        return null;
    const fullPath = path.join(catalogPath, relativePath);
    return fs.existsSync(fullPath) ? fullPath : null;
}
/**
 * Localiza a pasta catalog/ no workspace ou no globalStorage.
 * @param workspaceRoot Raiz do workspace
 * @param globalStoragePath Caminho do globalStorage da extensão
 * @returns Caminho absoluto para a pasta catalog/ ou null
 */
function findCatalogPath(workspaceRoot, globalStoragePath) {
    // 1. Procura catalog/ direto no workspace (ex: abrindo o próprio ai-governance-hub)
    const localCatalog = path.join(workspaceRoot, 'catalog');
    if (fs.existsSync(localCatalog))
        return localCatalog;
    // 2. Procura na pasta agentes_foursys clonada na raiz do workspace (processo do Manual)
    const workspaceCatalog = path.join(workspaceRoot, 'agentes_foursys', 'catalog');
    if (fs.existsSync(workspaceCatalog))
        return workspaceCatalog;
    // 3. Fallback: globalStorage (caso antigo)
    const globalCatalog = path.join(globalStoragePath, 'agentes_foursys', 'catalog');
    if (fs.existsSync(globalCatalog))
        return globalCatalog;
    return null;
}
//# sourceMappingURL=catalog-loader.js.map