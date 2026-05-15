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
exports.PlaybookSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
class PlaybookSidebarProvider {
    constructor(_context) {
        this._context = _context;
    }
    resolveWebviewView(webviewView, _context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri]
        };
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const isConnected = this._checkConnection(workspaceRoot);
        webviewView.webview.html = this._getHtmlForWebview(isConnected);
        // Captura mensagens da Webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.value) {
                case 'Connect':
                    this._connectToHub(webviewView);
                    break;
                case 'InsertStory':
                    vscode.commands.executeCommand('playbook.insertStory');
                    break;
                case 'ValidateStory':
                    vscode.commands.executeCommand('playbook.validateStory');
                    break;
                case 'TechnicalRules':
                    vscode.commands.executeCommand('playbook.technicalRules');
                    break;
                case 'Develop':
                    vscode.commands.executeCommand('playbook.develop');
                    break;
                case 'UnitTests':
                    vscode.commands.executeCommand('playbook.unitTests');
                    break;
                case 'Documentation':
                    vscode.commands.executeCommand('playbook.documentation');
                    break;
            }
        });
    }
    /**
     * Verifica se o catálogo está acessível (no workspace ou via pasta catalog local).
     */
    _checkConnection(workspaceRoot) {
        if (!workspaceRoot)
            return false;
        // Verifica se a pasta agentes_foursys existe na raiz do workspace
        if (fs.existsSync(path.join(workspaceRoot, 'agentes_foursys', 'catalog')))
            return true;
        // Verifica se a pasta catalog existe diretamente (ex: abrindo o próprio ai-governance-hub)
        if (fs.existsSync(path.join(workspaceRoot, 'catalog')))
            return true;
        return false;
    }
    /**
     * Clona o repositório do Hub para a raiz do workspace (visível ao desenvolvedor).
     * Igual ao processo documentado no MANUAL_AI_GOVERNANCE_HUB.
     */
    _connectToHub(webviewView) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('❌ Nenhum workspace aberto. Abra uma pasta primeiro.');
            return;
        }
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Conectando ao AI Governance Hub...",
            cancellable: false
        }, async () => {
            return new Promise((resolve, reject) => {
                // Remove pasta antiga se existir (mesmo comando do manual)
                const targetPath = path.join(workspaceRoot, 'agentes_foursys');
                if (fs.existsSync(targetPath)) {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                }
                const cmd = `git clone --branch hub-ia-arquitetura --depth 1 https://github.com/danielbissacot/ai-governance-hub.git agentes_foursys`;
                (0, child_process_1.exec)(cmd, { cwd: workspaceRoot }, (error, stdout, stderr) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Erro ao conectar: ${error.message}`);
                        reject(error);
                    }
                    else {
                        // SALVA O CAMINHO PARA A EXTENSÃO USAR
                        const catalogPath = path.join(workspaceRoot, 'agentes_foursys', 'catalog');
                        this._context.globalState.update('catalogPath', catalogPath);
                        vscode.window.showInformationMessage("Hub Foursys conectado com sucesso! 🎉 Pasta 'agentes_foursys' disponível no workspace.");
                        webviewView.webview.html = this._getHtmlForWebview(true);
                        resolve();
                    }
                });
            });
        });
    }
    _getHtmlForWebview(isConnected) {
        const statusBadge = isConnected
            ? '<span style="color: #4CAF50;">● Hub Ativo</span>'
            : '<span style="color: #f44336;">○ Desconectado</span>';
        const connectButton = isConnected
            ? ''
            : `<button class="btn-connect" onclick="sendAction('Connect')">⚡ CONECTAR AO HUB FOURSYS</button>`;
        return `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        padding: 15px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-sideBar-background);
                    }
                    .header {
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .status {
                        font-size: 10px;
                        margin-top: 5px;
                        opacity: 0.8;
                        font-weight: bold;
                        text-transform: uppercase;
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
                        font-size: 11px;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                    }
                    .btn:hover { filter: brightness(1.2); transform: translateX(4px); }
                    .btn-connect {
                        background-color: #e65100;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        width: 100%;
                        font-weight: bold;
                        margin-bottom: 20px;
                        font-size: 11px;
                    }
                    .btn-connect:hover { background-color: #ef6c00; }
                    h2 {
                        font-size: 10px;
                        text-transform: uppercase;
                        margin-bottom: 12px;
                        opacity: 0.6;
                        letter-spacing: 1.5px;
                        margin-top: 24px;
                        font-weight: 800;
                    }
                    .disabled { opacity: 0.3; pointer-events: none; filter: grayscale(1); }
                    .fase-icon { margin-right: 8px; font-size: 14px; }
                    .step-number {
                        background: rgba(255,255,255,0.15);
                        border-radius: 50%;
                        width: 18px;
                        height: 18px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 9px;
                        font-weight: bold;
                        margin-right: 8px;
                        flex-shrink: 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3 style="margin:0; font-size: 16px;">🧠 Agentes Foursys</h3>
                    <div class="status">${statusBadge}</div>
                </div>

                ${connectButton}

                <div class="${isConnected ? '' : 'disabled'}">
                    <h2>📘 Playbook de Engenharia</h2>
                    <button class="btn" onclick="sendAction('InsertStory')">
                        <span class="step-number">1</span>
                        <span class="fase-icon">📝</span> Inserir História
                    </button>
                    <button class="btn" onclick="sendAction('ValidateStory')">
                        <span class="step-number">2</span>
                        <span class="fase-icon">✅</span> Validação da História
                    </button>
                    <button class="btn" onclick="sendAction('TechnicalRules')">
                        <span class="step-number">3</span>
                        <span class="fase-icon">📐</span> Regras Técnicas
                    </button>
                    <button class="btn" onclick="sendAction('Develop')">
                        <span class="step-number">4</span>
                        <span class="fase-icon">🚀</span> Desenvolver
                    </button>
                    <button class="btn" onclick="sendAction('UnitTests')">
                        <span class="step-number">5</span>
                        <span class="fase-icon">🧪</span> Testes Unitários
                    </button>
                    <button class="btn" onclick="sendAction('Documentation')">
                        <span class="step-number">6</span>
                        <span class="fase-icon">📋</span> Documentação
                    </button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    function sendAction(value) {
                        vscode.postMessage({ type: 'onAction', value: value });
                    }
                </script>
            </body>
            </html>`;
    }
}
exports.PlaybookSidebarProvider = PlaybookSidebarProvider;
PlaybookSidebarProvider.viewType = 'agentes-foursys-sidebar-view';
//# sourceMappingURL=sidebar-provider.js.map