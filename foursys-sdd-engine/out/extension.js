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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ai_client_1 = require("./ai-client");
const catalog_loader_1 = require("./catalog-loader");
const sidebar_provider_1 = require("./sidebar-provider");
// ============================================================
// Foursys SDD Engine V1.2.0 - O MAESTRO DA ENGENHARIA
// ============================================================
const DOC_FOLDER = 'doc_projeto';
function getDocPath(rootPath) {
    const docPath = path.join(rootPath, DOC_FOLDER);
    if (!fs.existsSync(docPath)) {
        fs.mkdirSync(docPath, { recursive: true });
    }
    return docPath;
}
async function openFile(filePath) {
    if (fs.existsSync(filePath)) {
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
    }
}
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('Foursys SDD');
    outputChannel.appendLine('[Foursys SDD] Motor V1.2 inicializado!');
    const agentes = vscode.chat.createChatParticipant('foursys_sdd', async (request, chatContext, response, token) => {
        await executeSDDPhase(request.command || '', response, context, outputChannel);
    });
    agentes.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'logo.png');
    context.subscriptions.push(agentes);
    context.subscriptions.push(vscode.commands.registerCommand('foursys.constitution', () => executeSDDPhase('constitution', null, context, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('foursys.specify', () => executeSDDPhase('specify', null, context, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('foursys.plan', () => executeSDDPhase('plan', null, context, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('foursys.tasks', () => executeSDDPhase('tasks', null, context, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('foursys.implement', () => executeSDDPhase('implement', null, context, outputChannel)));
    const sidebarProvider = new sidebar_provider_1.FoursysSDDSidebarProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebar_provider_1.FoursysSDDSidebarProvider.viewType, sidebarProvider));
}
async function executeSDDPhase(command, chatResponse, context, outputChannel) {
    const rootPath = getWorkspaceRoot();
    if (!rootPath) {
        const msg = '❌ Nenhum workspace aberto.';
        if (chatResponse) {
            chatResponse.markdown(msg);
        }
        else {
            vscode.window.showErrorMessage(msg);
        }
        return;
    }
    const savedPath = context.globalState.get('catalogPath');
    const catalogPath = (0, catalog_loader_1.findCatalogPath)(rootPath, savedPath || '');
    outputChannel.show(true);
    outputChannel.appendLine(`\n[SDD] ▶ Iniciando: ${command}`);
    const needsCatalog = ['specify', 'plan', 'implement'];
    if (!catalogPath && needsCatalog.includes(command)) {
        const msg = '❌ Catálogo não encontrado. Aponte para a pasta /catalog do seu Hub.';
        if (chatResponse) {
            chatResponse.markdown(msg);
        }
        else {
            const select = 'Selecionar Pasta';
            vscode.window.showErrorMessage(msg, select).then(selection => {
                if (selection === select) {
                    vscode.window.showOpenDialog({ canSelectFolders: true }).then(uris => {
                        if (uris && uris[0]) {
                            context.globalState.update('catalogPath', uris[0].fsPath);
                            vscode.window.showInformationMessage('✅ Catálogo configurado! Clique novamente na fase.');
                        }
                    });
                }
            });
        }
        return;
    }
    const docPath = getDocPath(rootPath);
    let playbookPath = '';
    let outputPath = '';
    let contextFiles = [];
    let taskName = '';
    let isDev = false;
    const builtinSDD = context.extensionUri.fsPath;
    switch (command) {
        case 'constitution':
            playbookPath = path.join(builtinSDD, 'catalog', 'sdd', 'foursys-constitution.md');
            outputPath = path.join(docPath, 'constitution.md');
            taskName = 'Constitution';
            break;
        case 'specify':
            playbookPath = path.join(catalogPath || '', 'playbook', 'fase1_refinamento_negocio', 'FASE1_REFINAMENTO_NEGOCIO.md');
            outputPath = path.join(docPath, 'user_story.md');
            contextFiles = [path.join(docPath, 'constitution.md')];
            taskName = 'Specify';
            break;
        case 'plan':
            playbookPath = path.join(catalogPath || '', 'playbook', 'fase2_desenho_tecnico', 'FASE2_ESPECIFICACAO_TECNICA.md');
            outputPath = path.join(docPath, 'implementation_plan.md');
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'user_story.md')];
            taskName = 'Plan';
            break;
        case 'tasks':
            playbookPath = path.join(builtinSDD, 'catalog', 'sdd', 'foursys-tasks.md');
            outputPath = path.join(docPath, 'task_list.md');
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'implementation_plan.md')];
            taskName = 'Tasks';
            break;
        case 'implement':
            outputPath = path.join(docPath, 'output_desenvolvimento.md');
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'implementation_plan.md'), path.join(docPath, 'task_list.md')];
            taskName = 'Implement';
            isDev = true;
            break;
    }
    // Lógica especial para Specify (sem input superior)
    if (command === 'specify') {
        const currentContent = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
        if (currentContent.trim() === '' || currentContent.includes('DESCREVA AQUI')) {
            const template = `# User Story\n\n**TECNOLOGIA:** [Angular / Spring Boot / COBOL]\n\n**NECESSIDADE:**\nDESCREVA AQUI o que você precisa construir...`;
            fs.writeFileSync(outputPath, template);
            await openFile(outputPath);
            vscode.window.showInformationMessage('📝 Descreva sua necessidade no arquivo user_story.md e clique em Specify novamente.');
            return;
        }
    }
    // Lógica especial para Implement (Menu Dinâmico de Agentes)
    if (command === 'implement') {
        const availableSkills = catalogPath ? (0, catalog_loader_1.listAvailableSkills)(catalogPath) : [];
        if (availableSkills.length > 0) {
            const selection = await vscode.window.showQuickPick(availableSkills.map(s => s.label), {
                placeHolder: '🤖 Escolha o Agente Especialista para esta implementação:',
                ignoreFocusOut: true
            });
            if (!selection)
                return;
            const selectedSkill = availableSkills.find(s => s.label === selection);
            playbookPath = selectedSkill ? selectedSkill.path : '';
        }
        else {
            // Fallback se não encontrar a pasta agents_skills
            const storyPath = path.join(docPath, 'user_story.md');
            let tech = (0, catalog_loader_1.detectTechnology)(storyPath);
            if (!tech) {
                const selection = await vscode.window.showQuickPick(['Angular', 'Spring Boot', 'COBOL'], {
                    placeHolder: 'Qual tecnologia vamos implementar?'
                });
                if (!selection)
                    return;
                tech = selection === 'Spring Boot' ? 'spring_boot' : selection.toLowerCase();
            }
            playbookPath = (0, catalog_loader_1.findAgentSkill)(catalogPath || '', tech) || '';
        }
        outputChannel.appendLine(`[SDD] 🤖 Agente Carregado: ${path.basename(playbookPath)}`);
    }
    if (!playbookPath || !fs.existsSync(playbookPath)) {
        const msg = `❌ Playbook não encontrado: ${playbookPath}`;
        if (chatResponse) {
            chatResponse.markdown(msg);
        }
        else {
            vscode.window.showErrorMessage(msg);
        }
        return;
    }
    if (chatResponse) {
        chatResponse.markdown(`🔄 **Foursys SDD**: Iniciando **${taskName}**...`);
    }
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Foursys SDD: ${taskName}...`,
        cancellable: false
    }, async () => {
        try {
            const systemPrompt = (0, catalog_loader_1.loadPlaybook)(playbookPath);
            let userContext = '';
            contextFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    userContext += `\n--- ARQUIVO: ${path.basename(file)} ---\n${fs.readFileSync(file, 'utf8')}\n`;
                }
            });
            let finalPrompt = '';
            if (command === 'specify') {
                const req = fs.readFileSync(outputPath, 'utf8');
                finalPrompt = `Gere a User Story completa com critérios de aceite baseada nesta necessidade:\n\n${req}\n\n${userContext}`;
            }
            else if (command === 'plan') {
                finalPrompt = `Gere o Plano de Implementação Técnica:\n\n${userContext}`;
            }
            else if (command === 'tasks') {
                finalPrompt = `Gere a lista de tarefas atômicas:\n\n${userContext}`;
            }
            else if (isDev) {
                finalPrompt = `DESENVOLVA O CÓDIGO COMPLETO:\n\n${userContext}`;
            }
            else {
                finalPrompt = `Analise e gere o documento:\n\n${userContext || 'Inicie agora.'}`;
            }
            const fullText = await ai_client_1.AIClient.sendPrompt(systemPrompt, finalPrompt, outputChannel);
            outputChannel.show(true);
            if (chatResponse) {
                chatResponse.markdown(fullText);
            }
            if (isDev) {
                const filesCreated = extractAndSaveFiles(fullText, rootPath, outputChannel);
                if (chatResponse) {
                    chatResponse.markdown(`\n\n🚀 **SDD Implement Concluído!** ${filesCreated} arquivos gerados.`);
                }
                else {
                    vscode.window.showInformationMessage(`🚀 SDD: ${filesCreated} arquivos gerados.`);
                }
            }
            else {
                fs.writeFileSync(outputPath, fullText);
                await openFile(outputPath);
                const msg = `✅ Artefato salvo e aberto: ${path.basename(outputPath)}`;
                if (chatResponse) {
                    chatResponse.markdown(`\n\n${msg}`);
                }
                else {
                    vscode.window.showInformationMessage(msg);
                }
            }
        }
        catch (error) {
            if (chatResponse) {
                chatResponse.markdown(`❌ Erro: ${error.message}`);
            }
            else {
                vscode.window.showErrorMessage(`Erro: ${error.message}`);
            }
        }
    });
}
function getWorkspaceRoot() {
    const folders = vscode.workspace.workspaceFolders;
    return folders ? folders[0].uri.fsPath : null;
}
function extractAndSaveFiles(response, rootPath, outputChannel) {
    outputChannel.appendLine('------------------------------------------------------------');
    outputChannel.appendLine('[SISTEMA] 📂 Iniciando extração física SDD...');
    const fileRegex = /\/\/\s*FILEPATH:\s*([^\s\n]+)\s*\n([\s\S]*?)(?=\/\/\s*FILEPATH:|$)/gi;
    let match;
    let count = 0;
    while ((match = fileRegex.exec(response)) !== null) {
        const filePath = match[1].trim();
        const code = match[2].trim().replace(/```[\w]*\s*$/, '').trim();
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootPath, filePath);
        const dir = path.dirname(fullPath);
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, code);
            outputChannel.appendLine(`[SAVE] ✅ ${filePath}`);
            count++;
        }
        catch (err) {
            outputChannel.appendLine(`[ERRO] ${filePath}: ${err.message}`);
        }
    }
    outputChannel.appendLine(`[SISTEMA] 🚀 Finalizado: ${count} arquivo(s) atualizado(s).`);
    outputChannel.appendLine('------------------------------------------------------------');
    return count;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map