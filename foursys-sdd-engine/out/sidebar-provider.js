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
exports.FoursysSDDSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
class FoursysSDDSidebarProvider {
    _context;
    static viewType = 'foursys-sdd-sidebar-view';
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
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.value) {
                case 'Connect':
                    this._connectToHub(webviewView);
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
    _checkConnection(workspaceRoot) {
        if (!workspaceRoot)
            return false;
        if (fs.existsSync(path.join(workspaceRoot, 'agentes_foursys', 'catalog')))
            return true;
        if (fs.existsSync(path.join(workspaceRoot, 'catalog')))
            return true;
        return false;
    }
    _connectToHub(webviewView) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Conectando ao Foursys SDD Hub...",
            cancellable: false
        }, async () => {
            return new Promise((resolve, reject) => {
                const cmd = `git clone --branch hub-ia-arquitetura --depth 1 https://github.com/danielbissacot/ai-governance-hub.git agentes_foursys`;
                (0, child_process_1.exec)(cmd, { cwd: workspaceRoot }, (error) => {
                    if (error) {
                        vscode.window.showErrorMessage(`Erro ao conectar: ${error.message}`);
                        reject(error);
                    }
                    else {
                        const catalogPath = path.join(workspaceRoot, 'agentes_foursys', 'catalog');
                        this._context.globalState.update('catalogPath', catalogPath);
                        vscode.window.showInformationMessage("Foursys SDD Hub conectado!");
                        webviewView.webview.html = this._getHtmlForWebview(true);
                        resolve();
                    }
                });
            });
        });
    }
    _getHtmlForWebview(isConnected) {
        return `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: sans-serif; padding: 15px; color: var(--vscode-foreground); background-color: var(--vscode-sideBar-background); }
                    .header { border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; margin-bottom: 20px; }
                    .btn { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 8px; text-align: left; font-size: 11px; display: flex; align-items: center; }
                    .btn:hover { filter: brightness(1.2); }
                    .btn-connect { background-color: #0046ad; color: white; border: none; padding: 12px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; margin-bottom: 20px; }
                    .disabled { opacity: 0.3; pointer-events: none; }
                    .step-number { background: rgba(255,255,255,0.2); border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3 style="margin:0;">🚀 Foursys SDD Engine</h3>
                    <div style="font-size: 9px; opacity: 0.6; margin-top: 4px;">v0.1.0 PREVIEW</div>
                </div>
                ${isConnected ? '' : '<button class="btn-connect" onclick="sendAction(\'Connect\')">CONECTAR AO HUB</button>'}
                <div class="${isConnected ? '' : 'disabled'}">
                    <button class="btn" onclick="sendAction('Constitution')"><span class="step-number">0</span> 🏛️ Constitution</button>
                    <button class="btn" onclick="sendAction('Specify')"><span class="step-number">1</span> 📝 Specify (Story)</button>
                    <button class="btn" onclick="sendAction('Plan')"><span class="step-number">2</span> 📐 Plan (Técnico)</button>
                    <button class="btn" onclick="sendAction('Tasks')"><span class="step-number">3</span> 📋 Tasks (Checklist)</button>
                    <button class="btn" onclick="sendAction('Implement')"><span class="step-number">4</span> 🚀 Implement (Motor)</button>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    function sendAction(value) { vscode.postMessage({ value: value }); }
                </script>
            </body>
            </html>`;
    }
}
exports.FoursysSDDSidebarProvider = FoursysSDDSidebarProvider;
//# sourceMappingURL=sidebar-provider.js.map