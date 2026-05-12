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
exports.AIClient = void 0;
const vscode = __importStar(require("vscode"));
class AIClient {
    static async sendPrompt(systemPrompt, userPrompt, outputChannel) {
        outputChannel.appendLine(`[IA] Enviando prompt para o modelo de IA...`);
        try {
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o'
            });
            if (models.length === 0) {
                throw new Error('Nenhum modelo de IA disponível. Verifique se o GitHub Copilot está ativo.');
            }
            const model = models[0];
            const instructionsPrefix = `VOCÊ É O AGENTE DE ENGENHARIA FOURSYS SDD. 
Siga estritamente as regras da CONSTITUIÇÃO e do PLAYBOOK fornecidos abaixo. 
NÃO faça perguntas, NÃO seja educado, NÃO ofereça ajuda adicional. 
GERE APENAS O CONTEÚDO TÉCNICO SOLICITADO NO FORMATO ESPECIFICADO.

PLAYBOOK / INSTRUÇÕES:
${systemPrompt}`;
            const messages = [
                vscode.LanguageModelChatMessage.User(instructionsPrefix),
                vscode.LanguageModelChatMessage.User(`EXECUTAR AGORA SOBRE ESTE CONTEXTO:\n${userPrompt}`)
            ];
            const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
            let fullResponse = '';
            for await (const chunk of response.text) {
                fullResponse += chunk;
            }
            outputChannel.appendLine('[IA] Resposta recebida com sucesso. ✅');
            outputChannel.appendLine('------------------------------------------------------------');
            outputChannel.appendLine(fullResponse);
            outputChannel.appendLine('------------------------------------------------------------');
            outputChannel.appendLine('[IA] Analisando conteúdo para extração...');
            return fullResponse;
        }
        catch (error) {
            outputChannel.appendLine(`[IA ERRO] ${error.message || error}`);
            vscode.window.showErrorMessage(`❌ Erro na comunicação com a IA: ${error.message}`);
            throw error;
        }
    }
}
exports.AIClient = AIClient;
//# sourceMappingURL=ai-client.js.map