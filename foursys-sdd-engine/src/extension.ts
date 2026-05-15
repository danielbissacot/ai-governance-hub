import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AIClient } from './ai-client';
import { loadPlaybook, findCatalogPath } from './catalog-loader';
import { FoursysSDDSidebarProvider } from './sidebar-provider';

// ============================================================
// Foursys SDD Engine V2.1 - Híbrido (Orquestrador + Nativo)
// ============================================================

const DOC_FOLDER = 'doc_projeto';

function getDocPath(rootPath: string): string {
    const docPath = path.join(rootPath, DOC_FOLDER);
    if (!fs.existsSync(docPath)) {
        fs.mkdirSync(docPath, { recursive: true });
    }
    return docPath;
}

async function openFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
    }
}

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('Foursys SDD');
    outputChannel.appendLine('[Foursys SDD] Motor V2.1 Híbrido Online!');

    // Restaurado o Chat Participant apenas para orquestrar as respostas de Documentação
    const agentes = vscode.chat.createChatParticipant('foursys_sdd', async (request, chatContext, response, token) => {
        let referencesContext = '';
        for (const ref of request.references) {
            if (ref.value instanceof vscode.Uri) {
                try {
                    const doc = await vscode.workspace.openTextDocument(ref.value);
                    referencesContext += `\n--- REFERENCIA EXTERNA: ${path.basename(ref.value.fsPath)} ---\n${doc.getText()}\n`;
                } catch (e) {}
            }
        }
        await executeSDDPhase(request.command || '', request.prompt, referencesContext, response, context, outputChannel);
    });

    agentes.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'logo.png');
    context.subscriptions.push(agentes);

    // Fases 0 a 3: Acionam o Motor Antigo para garantir a criação física dos arquivos SDD
    context.subscriptions.push(vscode.commands.registerCommand('foursys.constitution', () => executeSDDPhase('constitution', '', '', null, context, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('foursys.specify', () => executeSDDPhase('specify', '', '', null, context, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('foursys.plan', () => executeSDDPhase('plan', '', '', null, context, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('foursys.tasks', () => executeSDDPhase('tasks', '', '', null, context, outputChannel)));
    
    // Fase 4: Codificação usa Copilot Nativo empoderado pela pasta .github
    context.subscriptions.push(vscode.commands.registerCommand('foursys.implement', () => {
        vscode.commands.executeCommand('workbench.action.chat.open', { 
            query: 'Leia os arquivos doc_projeto/constitution.md, doc_projeto/implementation_plan.md e doc_projeto/task_list.md deste workspace. Inicie a codificação estritamente de acordo com as tarefas listadas e invoque a Skill correspondente à tecnologia do projeto (ex: #agente-angular-foursys ou #agente-spring-foursys).' 
        });
    }));

    const sidebarProvider = new FoursysSDDSidebarProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(FoursysSDDSidebarProvider.viewType, sidebarProvider));
}

async function executeSDDPhase(command: string, userInstruction: string, referencesContext: string, chatResponse: vscode.ChatResponseStream | null, context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    const rootPath = getWorkspaceRoot();
    if (!rootPath) return;

    const savedPath = context.globalState.get<string>('catalogPath');
    const catalogPath = findCatalogPath(rootPath, savedPath || '');
    const docPath = getDocPath(rootPath);
    const builtinSDD = context.extensionUri.fsPath;

    outputChannel.show(true);
    outputChannel.appendLine(`\n[SDD] ▶ Iniciando documentação: ${command}`);

    if (chatResponse) { chatResponse.markdown(`🔄 **Foursys SDD**: Iniciando fase de especificação **${command.toUpperCase()}**...\n\n`); }

    let playbookPath = '';
    let outputPath = '';
    let contextFiles: string[] = [];

    if (chatResponse) { chatResponse.progress('Buscando Playbook e Regras do Hub...'); }

    switch (command) {
        case 'constitution':
            playbookPath = path.join(catalogPath || '', 'playbook', 'sdd', 'foursys-constitution.md');
            if (!fs.existsSync(playbookPath)) { playbookPath = path.join(builtinSDD, 'catalog', 'sdd', 'foursys-constitution.md'); }
            outputPath = path.join(docPath, 'constitution.md');
            break;
        case 'specify':
            playbookPath = path.join(catalogPath || '', 'playbook', 'fase1_refinamento_negocio', 'FASE1_REFINAMENTO_NEGOCIO.md');
            outputPath = path.join(docPath, 'user_story.md');
            contextFiles = [path.join(docPath, 'constitution.md')];
            break;
        case 'clarify':
            playbookPath = path.join(builtinSDD, 'catalog', 'sdd', 'foursys-clarify.md');
            outputPath = ''; // Clarify não salva arquivo obrigatoriamente, mas vamos salvar se o dev quiser
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'user_story.md')];
            break;
        case 'plan':
            playbookPath = path.join(catalogPath || '', 'playbook', 'fase2_desenho_tecnico', 'FASE2_ESPECIFICACAO_TECNICA.md');
            outputPath = path.join(docPath, 'implementation_plan.md');
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'user_story.md')];
            break;
        case 'analyze':
            playbookPath = path.join(builtinSDD, 'catalog', 'sdd', 'foursys-analyze.md');
            outputPath = path.join(docPath, 'analysis_report.md');
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'user_story.md'), path.join(docPath, 'implementation_plan.md')];
            break;
        case 'tasks':
            playbookPath = path.join(catalogPath || '', 'playbook', 'sdd', 'foursys-tasks.md');
            if (!fs.existsSync(playbookPath)) { playbookPath = path.join(builtinSDD, 'catalog', 'sdd', 'foursys-tasks.md'); }
            outputPath = path.join(docPath, 'task_list.md');
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'implementation_plan.md')];
            break;
        case 'checklist':
            playbookPath = path.join(builtinSDD, 'catalog', 'sdd', 'foursys-checklist.md');
            outputPath = path.join(docPath, 'quality_checklist.md');
            contextFiles = [path.join(docPath, 'constitution.md'), path.join(docPath, 'implementation_plan.md'), path.join(docPath, 'task_list.md')];
            break;
    }

    if (command === 'specify' && userInstruction.trim() === '') {
        const fileExists = fs.existsSync(outputPath);
        const content = fileExists ? fs.readFileSync(outputPath, 'utf8') : '';
        if (!fileExists || content.trim() === '' || content.includes('DESCREVA AQUI')) {
            const template = `# User Story\n\n**TECNOLOGIA:** [Angular / Spring Boot / COBOL]\n\n**NECESSIDADE:**\nDESCREVA AQUI o que você precisa construir...`;
            fs.writeFileSync(outputPath, template);
            await openFile(outputPath);
            if (chatResponse) { chatResponse.markdown('📝 Por favor, descreva sua necessidade no arquivo `user_story.md` e rode o comando novamente.'); }
            return;
        }
    }

    if (!playbookPath || !fs.existsSync(playbookPath)) {
        if (chatResponse) { chatResponse.markdown(`⚠️ Agente ou Playbook não encontrado em ${playbookPath}`); }
        return;
    }

    try {
        const playbookName = path.basename(playbookPath, '.md');
        outputChannel.appendLine(`[SDD] 🧠 Usando Playbook: ${playbookName}`);

        const systemPromptRaw = loadPlaybook(playbookPath);
        const systemPrompt = `VOCÊ É O AGENTE DE ENGENHARIA FOURSYS SDD.
FOCO: GERAÇÃO DE DOCUMENTAÇÃO DE SOFTWARE.
REGRAS ESTRITAS:
1. IGNORE SAUDAÇÕES. NÃO faça perguntas desnecessárias.
2. GERE O DOCUMENTO MARKDOWN DIRETAMENTE, sem introduções.
3. Siga estritamente a CONSTITUIÇÃO e o PLAYBOOK fornecidos abaixo.
4. GERE APENAS O CONTEÚDO TÉCNICO SOLICITADO NO FORMATO ESPECIFICADO.

PLAYBOOK BASE:
${systemPromptRaw}`;

        let userContext = referencesContext; 
        contextFiles.forEach(file => {
            if (fs.existsSync(file)) {
                userContext += `\n--- ARQUIVO DO PROJETO: ${path.basename(file)} ---\n${fs.readFileSync(file, 'utf8')}\n`;
            }
        });

        const instruction = userInstruction.trim() !== '' ? `INSTRUÇÃO ADICIONAL: ${userInstruction}\n\n` : '';
        const finalPrompt = `${instruction}GERE O ARQUIVO MD COMPLETO.\nCONTEXTO:\n${userContext}`;

        if (chatResponse) { chatResponse.progress('IA gerando o documento SDD...'); }

        const fullText = await AIClient.sendPrompt(systemPrompt, finalPrompt, outputChannel, (chunk) => {
            if (chatResponse) { chatResponse.markdown(chunk); }
        });

        if (outputPath) {
            fs.writeFileSync(outputPath, fullText);
            await openFile(outputPath);
            if (chatResponse) { chatResponse.markdown(`\n\n✅ **Salvo e Aberto com Sucesso em**: ${path.basename(outputPath)}`); }
        }
        
    } catch (error: any) {
        if (chatResponse) { chatResponse.markdown(`❌ Erro: ${error.message}`); }
    }
}

function getWorkspaceRoot(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    return folders ? folders[0].uri.fsPath : null;
}

export function deactivate() {}
