import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

export class FoursysSDDSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'foursys-sdd-sidebar-view';

    constructor(private readonly _context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri]
        };

        const updateWebview = () => {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
            const isConnected = this._checkConnection(workspaceRoot);
            const isAngular = this._isAngularWorkspace(workspaceRoot);
            webviewView.webview.html = this._getHtmlForWebview(isConnected, isAngular);
        };

        updateWebview();

        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.value) {
                case 'Sync':
                    await this._syncHub(webviewView);
                    updateWebview();
                    break;
                case 'Constitution':
                    vscode.commands.executeCommand('foursys.constitution');
                    break;
                case 'Specify':
                    vscode.commands.executeCommand('foursys.specify');
                    break;
                case 'Plan':
                    vscode.commands.executeCommand('foursys.plan');
                    break;
                case 'Tasks':
                    vscode.commands.executeCommand('foursys.tasks');
                    break;
                case 'Implement':
                    vscode.commands.executeCommand('foursys.implement');
                    break;
            }
        });
    }

    private _checkConnection(workspaceRoot: string): boolean {
        if (!workspaceRoot) return false;
        const p1 = path.join(workspaceRoot, 'agentes_foursys', 'catalog');
        const p2 = path.join(workspaceRoot, 'catalog');
        return fs.existsSync(p1) || fs.existsSync(p2);
    }

    private async _syncHub(webviewView: vscode.WebviewView) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage("Abra uma pasta para sincronizar o Hub.");
            return;
        }

        const agentsPath = path.join(workspaceRoot, 'agentes_foursys');
        const exists = fs.existsSync(agentsPath);

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: exists ? "Atualizando Agentes do Hub..." : "Baixando Agentes do Hub...",
            cancellable: false
        }, async () => {
            return new Promise<void>((resolve, reject) => {
                let cmd = '';
                if (!exists) {
                    cmd = `git clone --branch hub-ia-arquitetura --depth 1 https://github.com/danielbissacot/ai-governance-hub.git agentes_foursys`;
                } else {
                    // Se já existe, tenta atualizar (pull)
                    cmd = `git fetch origin hub-ia-arquitetura && git reset --hard origin/hub-ia-arquitetura`;
                }

                exec(cmd, { cwd: exists ? agentsPath : workspaceRoot }, (error) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Erro na sincronização: ${error.message}`);
                        resolve(); // Resolve mesmo com erro para fechar o progresso
                    } else {
                        const catalogPath = path.join(workspaceRoot, 'agentes_foursys', 'catalog');
                        this._context.globalState.update('catalogPath', catalogPath);
                        this._injectCopilotCustomizations(workspaceRoot, catalogPath);
                        vscode.window.showInformationMessage(exists ? "Agentes atualizados! (Copilot Skills Injetadas)" : "Hub conectado com sucesso! (Copilot Skills Injetadas)");
                        resolve();
                    }
                });
            });
        });
    }

    private _isAngularWorkspace(workspaceRoot: string): boolean {
        if (!workspaceRoot) return false;
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        const angularJsonPath = path.join(workspaceRoot, 'angular.json');
        
        if (fs.existsSync(angularJsonPath)) return true;
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                return !!(pkg.dependencies?.['@angular/core'] || pkg.devDependencies?.['@angular/core']);
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    private _injectCopilotCustomizations(workspaceRoot: string, catalogPath: string) {
        try {
            const githubDir = path.join(workspaceRoot, '.github');
            if (!fs.existsSync(githubDir)) fs.mkdirSync(githubDir, { recursive: true });

            // 1. Inject Instructions
            const constitutionPath = path.join(catalogPath, 'playbook', 'sdd', 'foursys-constitution.md');
            if (fs.existsSync(constitutionPath)) {
                fs.copyFileSync(constitutionPath, path.join(githubDir, 'copilot-instructions.md'));
            }

            // 2. Inject Skills
            const skillsDir = path.join(githubDir, 'skills');
            if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });

            // From catalog/agents_skills (Recursive)
            const agentsSkillsPath = path.join(catalogPath, 'agents_skills');
            if (fs.existsSync(agentsSkillsPath)) {
                const getFilesRecursively = (dir: string): string[] => {
                    let results: string[] = [];
                    const list = fs.readdirSync(dir);
                    list.forEach(file => {
                        file = path.resolve(dir, file);
                        const stat = fs.statSync(file);
                        if (stat && stat.isDirectory()) {
                            results = results.concat(getFilesRecursively(file));
                        } else if (file.endsWith('.md')) {
                            results.push(file);
                        }
                    });
                    return results;
                };

                const allSkillFiles = getFilesRecursively(agentsSkillsPath);
                for (const fullPath of allSkillFiles) {
                    const skillName = path.basename(fullPath, '.md').toLowerCase().replace(/[^a-z0-9-]/g, '-');
                    fs.copyFileSync(fullPath, path.join(skillsDir, `${skillName}.md`));
                }
            }

            // From catalog/design-systems (Bradesco Liquid)
            const dsPath = path.join(catalogPath, 'design-systems');
            if (fs.existsSync(dsPath)) {
                const files = fs.readdirSync(dsPath);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        const skillName = path.basename(file, '.md').toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        fs.copyFileSync(path.join(dsPath, file), path.join(skillsDir, `${skillName}.md`));
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao injetar customizações nativas do Copilot:', e);
        }
    }



    private _getHtmlForWebview(isConnected: boolean, isAngular: boolean) {
        return `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    :root {
                        --foursys-orange: #ff6b00;
                    }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        padding: 15px; 
                        color: var(--vscode-foreground); 
                        background-color: var(--vscode-sideBar-background); 
                        line-height: 1.4;
                    }
                    .header { 
                        border-bottom: 1px solid var(--vscode-panel-border); 
                        padding-bottom: 12px; 
                        margin-bottom: 20px;
                        display: flex;
                        flex-direction: column;
                    }
                    .title {
                        font-size: 14px;
                        font-weight: bold;
                        color: var(--foursys-orange);
                        margin: 0;
                        display: flex;
                        align-items: center;
                    }
                    .version {
                        font-size: 9px;
                        opacity: 0.5;
                        margin-top: 2px;
                        font-weight: normal;
                    }
                    .btn { 
                        background-color: var(--vscode-button-background); 
                        color: var(--vscode-button-foreground); 
                        border: none; 
                        padding: 10px 12px; 
                        border-radius: 4px; 
                        cursor: pointer; 
                        width: 100%; 
                        margin-bottom: 8px; 
                        text-align: left; 
                        font-size: 12px; 
                        display: flex; 
                        align-items: center; 
                        transition: all 0.2s ease;
                    }
                    .btn:hover { background-color: var(--vscode-button-hoverBackground); transform: translateX(2px); }
                    
                    .btn-sync { 
                        background-color: var(--foursys-orange); 
                        color: white; 
                        font-weight: bold;
                        justify-content: center;
                        margin-top: 10px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    
                    .disabled { opacity: 0.4; pointer-events: none; filter: grayscale(1); }
                    
                    .step-number { 
                        background: rgba(255,255,255,0.15); 
                        border-radius: 4px; 
                        width: 18px; 
                        height: 18px; 
                        display: inline-flex; 
                        align-items: center; 
                        justify-content: center; 
                        margin-right: 12px; 
                        font-weight: bold; 
                        font-size: 10px;
                    }

                    .status-bar {
                        margin-top: 20px;
                        padding: 10px;
                        background: rgba(0,0,0,0.2);
                        border-radius: 4px;
                        font-size: 10px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .status-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: ${isConnected ? '#4caf50' : '#f44336'};
                        box-shadow: 0 0 5px ${isConnected ? '#4caf50' : '#f44336'};
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3 class="title">🚀 Foursys SDD Engine</h3>
                    <span class="version">v2.2.0 HÍBRIDO (SDD + COPILOT NATIVO)</span>
                </div>

                <div class="${isConnected ? '' : 'disabled'}">
                    <button class="btn" onclick="sendAction('Constitution')"><span class="step-number">0</span> 🏛️ Constitution</button>
                    <button class="btn" onclick="sendAction('Specify')"><span class="step-number">1</span> 📝 Specify (Story)</button>
                    <button class="btn" onclick="sendAction('Plan')"><span class="step-number">2</span> 📐 Plan (Técnico)</button>
                    <button class="btn" onclick="sendAction('Tasks')"><span class="step-number">3</span> 📋 Tasks (Checklist)</button>
                    <button class="btn" onclick="sendAction('Implement')"><span class="step-number">4</span> 🚀 Implement (Copilot Nativo)</button>
                </div>

                <button class="btn btn-sync" onclick="sendAction('Sync')">
                    ${isConnected ? '🔄 ATUALIZAR SKILLS' : '📥 CONECTAR AO HUB'}
                </button>

                <div class="status-bar">
                    <div class="status-dot"></div>
                    <span>Status: ${isConnected ? 'Hub Conectado' : 'Hub Desconectado'}</span>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    function sendAction(value) { vscode.postMessage({ value: value }); }
                </script>
            </body>
            </html>`;
    }
}
