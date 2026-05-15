import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PlaybookSidebarProvider } from './sidebar-provider';
import { AIClient } from './ai-client';
import { loadPlaybook, detectTechnology, findAgentSkill, findTestPlaybook, findReviewPlaybook, findCatalogPath } from './catalog-loader';

// ============================================================
// Playbook Engine V1.0.1 - REFINAMENTO DE LOGS E EXTRAÇÃO
// ============================================================

const OUTPUT_CHANNEL_NAME = 'Agentes Foursys';
const DOC_FOLDER = 'doc_projeto';

function getDocPath(rootPath: string): string {
    const docPath = path.join(rootPath, DOC_FOLDER);
    if (!fs.existsSync(docPath)) {
        fs.mkdirSync(docPath, { recursive: true });
    }
    return docPath;
}

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
    outputChannel.appendLine('[Agentes Foursys] Extensão ativada com sucesso!');

    const sidebarProvider = new PlaybookSidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(PlaybookSidebarProvider.viewType, sidebarProvider)
    );

    // ============================================================
    // REGISTRO DO CHAT PARTICIPANT (@agentes_foursys)
    // ============================================================
    const agentes = vscode.chat.createChatParticipant('agentes_foursys', async (request, chatContext, response, token) => {
        const rootPath = getWorkspaceRoot();
        if (!rootPath) {
            response.markdown('❌ Nenhum workspace aberto.');
            return;
        }

        // CORREÇÃO: Pegamos o catalogPath do globalState se ele existir, ou usamos o findCatalogPath padrão
        const savedPath = context.globalState.get<string>('catalogPath') || context.globalStorageUri.fsPath;
        const catalogPath = findCatalogPath(rootPath, savedPath);
        
        if (!catalogPath) {
            response.markdown('❌ Catálogo não encontrado. Clique em "Conectar" na Sidebar.');
            return;
        }

        const docPath = getDocPath(rootPath);
        let playbookPath = '';
        let outputPath = '';
        let contextPath = '';
        let taskName = '';
        let isDev = false;

        if (request.command === 'refinar') {
            playbookPath = path.join(catalogPath, 'playbook', 'fase1_refinamento_negocio', 'FASE1_REFINAMENTO_NEGOCIO.md');
            outputPath = path.join(docPath, 'output_refinamento.md');
            contextPath = path.join(docPath, 'user_story.md');
            taskName = 'Refinamento de Negócio';
        } else if (request.command === 'desenhar') {
            playbookPath = path.join(catalogPath, 'playbook', 'fase2_desenho_tecnico', 'FASE2_ESPECIFICACAO_TECNICA.md');
            outputPath = path.join(docPath, 'implementation_plan.md');
            contextPath = path.join(docPath, 'output_refinamento.md');
            taskName = 'Desenho Técnico';
        } else if (request.command === 'desenvolver') {
            const storyPath = path.join(docPath, 'user_story.md');
            const tech = detectTechnology(storyPath);
            playbookPath = findAgentSkill(catalogPath, tech || '') || '';
            outputPath = path.join(docPath, 'output_desenvolvimento.md');
            contextPath = path.join(docPath, 'implementation_plan.md');
            taskName = 'Codificação';
            isDev = true;
        } else if (request.command === 'review_angular' || request.command === 'review_java') {
            const tech = request.command === 'review_angular' ? 'angular' : 'spring_boot';
            playbookPath = findReviewPlaybook(catalogPath, tech) || '';
            outputPath = path.join(docPath, 'output_review.md');
            contextPath = path.join(docPath, 'user_story.md');
            taskName = `Code Review (${tech})`;
        } else if (request.command === 'teste_angular' || request.command === 'teste_java') {
            const tech = request.command === 'teste_angular' ? 'angular' : 'spring_boot';
            playbookPath = findTestPlaybook(catalogPath, tech) || '';
            outputPath = path.join(docPath, 'output_testes.md');
            contextPath = path.join(docPath, 'user_story.md');
            taskName = `Testes Unitários (${tech})`;
        }

        if (playbookPath && fs.existsSync(playbookPath)) {
            response.markdown(`🔄 **Agentes Foursys**: Iniciando **${taskName}**...`);
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Agentes Foursys: ${taskName}...`,
                cancellable: false
            }, async () => {
                try {
                    const systemPrompt = loadPlaybook(playbookPath);
                    const userContext = fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf8') : '';
                    
                    let finalPrompt = userContext;
                    if (isDev) {
                        finalPrompt = `DESENVOLVA O CÓDIGO AGORA SEGUINDO ESTE PLANO TÉCNICO.
VOCÊ DEVE SEGUIR ESTE FORMATO DE SAÍDA OBRIGATORIAMENTE:

// FILEPATH: caminho/do/arquivo.ts
import { ... } from '...';
// ... resto do código ...

REGRAS:
1. NÃO FAÇA PERGUNTAS, NÃO DÊ EXPLICAÇÕES.
2. APENAS O CÓDIGO COM OS MARCADORES // FILEPATH:.
3. CUMPRA O PLANO ABAIXO:
\n${userContext}`;
                    }

                    const fullText = await AIClient.sendPrompt(systemPrompt, finalPrompt, outputChannel);
                    response.markdown(fullText);
                    
                    if (isDev) {
                        const filesCreated = extractAndSaveFiles(fullText, rootPath, outputChannel);
                        response.markdown(`\n\n🚀 **Desenvolvimento Concluído!** ${filesCreated} arquivos criados/atualizados.`);
                    } else {
                        fs.writeFileSync(outputPath, fullText);
                        response.markdown(`\n\n✅ **Resultado salvo em**: \`doc_projeto/${path.basename(outputPath)}\``);
                    }
                } catch (error: any) {
                    response.markdown(`❌ Erro: ${error.message}`);
                }
            });
        }
    });

    agentes.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'logo.png');
    context.subscriptions.push(agentes);

    // ============================================================
    // COMANDOS DA SIDEBAR (LÓGICA ORIGINAL)
    // ============================================================

    context.subscriptions.push(vscode.commands.registerCommand('playbook.connect', () => {
        vscode.window.showInformationMessage('Use o botão "Conectar" na barra lateral.');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('playbook.insertStory', async () => {
        const rootPath = getWorkspaceRoot();
        if (!rootPath) return;
        const docPath = getDocPath(rootPath);
        const storyPath = path.join(docPath, 'user_story.md');
        if (fs.existsSync(storyPath)) {
            const doc = await vscode.workspace.openTextDocument(storyPath);
            await vscode.window.showTextDocument(doc, { preview: false });
            return;
        }
        const template = `# 📝 História de Usuário (User Story)

**Título**: [Ex: Implementar Login]
**Tecnologia**: [Informe: Angular | Java | COBOL]

## Narrativa
Como [tipo de usuário],
Quero [funcionalidade],
Para [benefício].

## Critérios de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## Regras de Negócio
- Regra 1
- Regra 2
`;
        fs.writeFileSync(storyPath, template);
        const doc = await vscode.workspace.openTextDocument(storyPath);
        await vscode.window.showTextDocument(doc, { preview: false });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('playbook.validateStory', async () => {
        const rootPath = getWorkspaceRoot();
        if (!rootPath) return;
        const catalogPath = findCatalogPath(rootPath, context.globalStorageUri.fsPath);
        if (!catalogPath) {
            vscode.window.showErrorMessage('❌ Catálogo não encontrado. Clique em "Conectar" na Sidebar.');
            return;
        }
        const docPath = getDocPath(rootPath);
        const storyPath = path.join(docPath, 'user_story.md');
        const playbookPath = path.join(catalogPath, 'playbook/fase1_refinamento_negocio/FASE1_REFINAMENTO_NEGOCIO.md');
        
        outputChannel.show();
        openCopilotChat(playbookPath, storyPath);
        try {
            const systemPrompt = loadPlaybook(playbookPath);
            const userStory = fs.readFileSync(storyPath, 'utf8');
            const response = await AIClient.sendPrompt(systemPrompt, userStory, outputChannel);
            fs.writeFileSync(path.join(docPath, 'output_refinamento.md'), response);
            const doc = await vscode.workspace.openTextDocument(path.join(docPath, 'output_refinamento.md'));
            await vscode.window.showTextDocument(doc, { preview: false });
        } catch (error: any) { outputChannel.appendLine(`[ERRO] ${error.message}`); }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('playbook.technicalRules', async () => {
        const rootPath = getWorkspaceRoot();
        if (!rootPath) return;
        const catalogPath = findCatalogPath(rootPath, context.globalStorageUri.fsPath);
        if (!catalogPath) {
            vscode.window.showErrorMessage('❌ Catálogo não encontrado.');
            return;
        }
        const docPath = getDocPath(rootPath);
        const refinementPath = path.join(docPath, 'output_refinamento.md');
        const playbookPath = path.join(catalogPath, 'playbook/fase2_desenho_tecnico/FASE2_ESPECIFICACAO_TECNICA.md');
        
        outputChannel.show();
        openCopilotChat(playbookPath, refinementPath);
        try {
            const systemPrompt = loadPlaybook(playbookPath);
            const refinement = fs.readFileSync(refinementPath, 'utf8');
            const response = await AIClient.sendPrompt(systemPrompt, refinement, outputChannel);
            fs.writeFileSync(path.join(docPath, 'implementation_plan.md'), response);
            const doc = await vscode.workspace.openTextDocument(path.join(docPath, 'implementation_plan.md'));
            await vscode.window.showTextDocument(doc, { preview: false });
        } catch (error: any) { outputChannel.appendLine(`[ERRO] ${error.message}`); }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('playbook.develop', async () => {
        const rootPath = getWorkspaceRoot();
        if (!rootPath) return;
        const catalogPath = findCatalogPath(rootPath, context.globalStorageUri.fsPath);
        if (!catalogPath) {
            vscode.window.showErrorMessage('❌ Catálogo não encontrado.');
            return;
        }
        const docPath = getDocPath(rootPath);
        const storyPath = path.join(docPath, 'user_story.md');
        const planPath = path.join(docPath, 'implementation_plan.md');
        const tech = detectTechnology(storyPath);
        if (!tech) {
            vscode.window.showErrorMessage('❌ Tecnologia não encontrada no arquivo user_story.md. Por favor, informe se é Angular, Java ou COBOL.');
            return;
        }

        const agentPath = findAgentSkill(catalogPath, tech);
        if (!agentPath) {
            vscode.window.showErrorMessage(`❌ Agente de desenvolvimento para "${tech}" não encontrado no catálogo.`);
            return;
        }
        
        outputChannel.show();
        openCopilotChat(agentPath, planPath);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Agentes Foursys: Gerando código...",
            cancellable: false
        }, async () => {
            try {
                const systemPrompt = loadPlaybook(agentPath);
                const plan = fs.readFileSync(planPath, 'utf8');
                const devPrompt = `DESENVOLVA O CÓDIGO AGORA SEGUINDO ESTE PLANO TÉCNICO.
VOCÊ DEVE SEGUIR ESTE FORMATO DE SAÍDA OBRIGATORIAMENTE:

// FILEPATH: caminho/do/arquivo.ts
import { ... } from '...';
// ... resto do código ...

// FILEPATH: outro/arquivo.html
<div>...</div>

REGRAS:
1. NÃO FAÇA PERGUNTAS, NÃO DÊ EXPLICAÇÕES.
2. APENAS O CÓDIGO COM OS MARCADORES // FILEPATH:.
3. CUMPRA O PLANO ABAIXO:
\n${plan}`;
                const response = await AIClient.sendPrompt(systemPrompt, devPrompt, outputChannel);
                const filesCreated = extractAndSaveFiles(response, rootPath, outputChannel);
                vscode.window.showInformationMessage(`🚀 Desenvolvimento concluído! ${filesCreated} arquivos criados.`);
            } catch (error: any) { 
                outputChannel.appendLine(`[ERRO] ${error.message}`); 
                vscode.window.showErrorMessage(`Erro no desenvolvimento: ${error.message}`);
            }
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('playbook.unitTests', async () => {
        const rootPath = getWorkspaceRoot();
        if (!rootPath) return;
        const catalogPath = findCatalogPath(rootPath, context.globalStorageUri.fsPath);
        if (!catalogPath) {
            vscode.window.showErrorMessage('❌ Catálogo não encontrado.');
            return;
        }
        const docPath = getDocPath(rootPath);
        const storyPath = path.join(docPath, 'user_story.md');
        const tech = detectTechnology(storyPath);
        if (!tech) {
            vscode.window.showErrorMessage('❌ Tecnologia não encontrada para gerar os testes. Verifique o arquivo user_story.md.');
            return;
        }
        
        outputChannel.show();
        outputChannel.appendLine(`[Testes] Iniciando Qualidade para ${tech}...`);
        const reviewPath = findReviewPlaybook(catalogPath, tech);
        if (reviewPath) {
            const reviewPrompt = loadPlaybook(reviewPath);
            const reviewRes = await AIClient.sendPrompt(reviewPrompt, 'Code review.', outputChannel);
            fs.writeFileSync(path.join(docPath, 'output_review.md'), reviewRes);
        }
        const testPath = findTestPlaybook(catalogPath, tech);
        if (testPath) {
            const testPrompt = loadPlaybook(testPath);
            const codeFiles = collectSourceFiles(rootPath, tech);
            const codeContext = codeFiles.map(f => `// FILEPATH: ${path.relative(rootPath, f)}\n${fs.readFileSync(f, 'utf8')}`).join('\n\n');
            const testRes = await AIClient.sendPrompt(testPrompt, codeContext, outputChannel);
            extractAndSaveFiles(testRes, rootPath, outputChannel);
            vscode.window.showInformationMessage('🧪 Testes concluídos!');
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('playbook.documentation', async () => {
        const rootPath = getWorkspaceRoot();
        if (!rootPath) return;
        const catalogPath = findCatalogPath(rootPath, context.globalStorageUri.fsPath);
        if (!catalogPath) {
            vscode.window.showErrorMessage('❌ Catálogo não encontrado.');
            return;
        }
        const docPath = getDocPath(rootPath);
        const playbookPath = path.join(catalogPath, 'playbook/fase4_homologacao_entrega/FASE4_CHECKLIST_HOMOLOGACAO.md');
        try {
            const systemPrompt = loadPlaybook(playbookPath);
            const response = await AIClient.sendPrompt(systemPrompt, 'Homologação.', outputChannel);
            fs.writeFileSync(path.join(docPath, 'output_homologacao.md'), response);
            const doc = await vscode.workspace.openTextDocument(path.join(docPath, 'output_homologacao.md'));
            await vscode.window.showTextDocument(doc, { preview: false });
        } catch (error: any) { outputChannel.appendLine(`[ERRO] ${error.message}`); }
    }));
}

function getWorkspaceRoot(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    return folders ? folders[0].uri.fsPath : null;
}

function extractAndSaveFiles(response: string, rootPath: string, outputChannel: vscode.OutputChannel): number {
    outputChannel.appendLine('------------------------------------------------------------');
    outputChannel.appendLine('[SISTEMA] 📂 Iniciando extração de arquivos...');
    
    // Regex melhorado: Busca // FILEPATH: e captura tudo até o próximo marcador ou fim de bloco de código
    const fileRegex = /\/\/\s*FILEPATH:\s*([^\s\n]+)\s*\n([\s\S]*?)(?=\/\/\s*FILEPATH:|$)/gi;
    let match;
    let count = 0;
    
    while ((match = fileRegex.exec(response)) !== null) {
        let filePath = match[1].trim();
        let code = match[2].trim();

        // Limpeza profunda de resquícios de markdown
        code = code.replace(/```[\w]*\s*$/, '').trim();
        
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootPath, filePath);
        const dir = path.dirname(fullPath);
        
        try {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fullPath, code);
            outputChannel.appendLine(`[SAVE] ✅ ${filePath}`);
            count++;
        } catch (err: any) {
            outputChannel.appendLine(`[ERRO SAVE] ❌ ${filePath}: ${err.message}`);
        }
    }

    if (count > 0) {
        outputChannel.appendLine(`[SISTEMA] 🚀 Finalizado: ${count} arquivo(s) criado(s)/atualizado(s).`);
    } else {
        outputChannel.appendLine(`[SISTEMA] ℹ️  Nenhum arquivo foi extraído desta resposta.`);
    }
    outputChannel.appendLine('------------------------------------------------------------');
    return count;
}

function collectSourceFiles(rootPath: string, technology: string): string[] {
    const results: string[] = [];
    const extensions = technology === 'angular' ? ['.ts', '.html'] : ['.java'];
    const srcDir = technology === 'angular' ? path.join(rootPath, 'src', 'app') : path.join(rootPath, 'src', 'main', 'java');
    function walk(dir: string) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(item => {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                if (!item.includes('node_modules')) walk(fullPath);
            } else if (extensions.some(ext => item.endsWith(ext)) && !item.includes('.spec.')) {
                results.push(fullPath);
            }
        });
    }
    walk(srcDir);
    return results;
}

async function openCopilotChat(playbookPath: string, contextPath: string) {
    const rootPath = getWorkspaceRoot();
    if (!rootPath) return;
    const query = `Estou usando o playbook #file:${path.relative(rootPath, playbookPath)}. Contexto: #file:${path.relative(rootPath, contextPath)}.`;
    await vscode.commands.executeCommand('workbench.action.chat.open', { query });
}

export function deactivate() {}
