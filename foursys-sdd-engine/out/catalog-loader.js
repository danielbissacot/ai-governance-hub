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
exports.findCatalogPath = findCatalogPath;
exports.listAvailableSkills = listAvailableSkills;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadPlaybook(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Playbook não encontrado: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const frontmatterRegex = /^---[\s\S]*?---\s*/;
    return raw.replace(frontmatterRegex, '').trim();
}
function detectTechnology(userStoryPath) {
    if (!fs.existsSync(userStoryPath))
        return null;
    const content = fs.readFileSync(userStoryPath, 'utf8');
    const techHeaderRegex = /Tecnologia\s*[:\-]\s*([^\r\n]*)/i;
    const match = content.match(techHeaderRegex);
    let techToAnalyze = match && match[1] ? match[1].toLowerCase() : content.toLowerCase();
    techToAnalyze = techToAnalyze.replace(/[\[\]\(\)]/g, '').replace(/informe[:\s]*/i, '').trim();
    if (techToAnalyze.includes('angular'))
        return 'angular';
    if (techToAnalyze.includes('java') || techToAnalyze.includes('spring'))
        return 'spring_boot';
    if (techToAnalyze.includes('cobol'))
        return 'cobol';
    return null;
}
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
function findCatalogPath(workspaceRoot, globalStoragePath) {
    const localCatalog = path.join(workspaceRoot, 'catalog');
    if (fs.existsSync(localCatalog))
        return localCatalog;
    const workspaceCatalog = path.join(workspaceRoot, 'agentes_foursys', 'catalog');
    if (fs.existsSync(workspaceCatalog))
        return workspaceCatalog;
    const globalCatalog = path.join(globalStoragePath, 'agentes_foursys', 'catalog');
    if (fs.existsSync(globalCatalog))
        return globalCatalog;
    return null;
}
function listAvailableSkills(catalogPath) {
    const skillsPath = path.join(catalogPath, 'agents_skills');
    if (!fs.existsSync(skillsPath))
        return [];
    const folders = fs.readdirSync(skillsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => {
        const folderName = dirent.name;
        const label = folderName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const agentFile = path.join(skillsPath, folderName, `AGENTE_${folderName.toUpperCase()}_FOURSYS.md`);
        return {
            label: `Agente ${label}`,
            path: fs.existsSync(agentFile) ? agentFile : path.join(skillsPath, folderName) // Fallback para a pasta
        };
    });
    return folders;
}
//# sourceMappingURL=catalog-loader.js.map