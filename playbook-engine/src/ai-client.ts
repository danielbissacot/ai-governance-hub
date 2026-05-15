import * as vscode from 'vscode';

/**
 * Cliente de comunicação com a LLM via GitHub Copilot.
 * Envia prompts formatados e retorna a resposta completa.
 */
export class AIClient {
    /**
     * Envia um prompt para o GitHub Copilot e retorna a resposta.
     * @param systemPrompt Instruções de sistema (conteúdo do .md do catálogo)
     * @param userPrompt Contexto do usuário (história, plano, código, etc.)
     * @param outputChannel Canal de output para exibir o progresso
     * @returns Resposta completa da LLM
     */
    static async sendPrompt(
        systemPrompt: string,
        userPrompt: string,
        outputChannel: vscode.OutputChannel
    ): Promise<string> {
        outputChannel.appendLine(`[IA] Enviando prompt para o modelo de IA...`);
        outputChannel.appendLine(`[IA] Instruções do Catálogo: ${systemPrompt.substring(0, 100)}...`);

        // Aviso amigável em PT-BR antes do diálogo de permissão do VS Code
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: '🤖 Agentes Foursys: Processando sua solicitação...',
            cancellable: false
        }, async () => { await new Promise(r => setTimeout(r, 1500)); });

        try {
            // Seleciona o modelo do Copilot
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o'
            });

            if (models.length === 0) {
                throw new Error('Nenhum modelo de IA disponível. Verifique se o GitHub Copilot está ativo.');
            }

            const model = models[0];
            
            // Reforço de instrução para evitar comportamento conversacional (conversa fiada)
            const instructionsPrefix = `VOCÊ É UM AGENTE DE AUTOMAÇÃO DE ENGENHARIA. 
Siga estritamente as regras do Playbook fornecidas abaixo. 
NÃO faça perguntas, NÃO seja educado, NÃO ofereça ajuda adicional. 
GERE APENAS O CONTEÚDO TÉCNICO SOLICITADO NO FORMATO ESPECIFICADO.
SEJA DIRETO E ENTREGUE O RELATÓRIO/CÓDIGO COMPLETO.

REGRAS DO PLAYBOOK:
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
            outputChannel.appendLine('[IA] Analisando conteúdo para extração...');
            return fullResponse;
        } catch (error: any) {
            const errorMsg = `[IA ERRO] ${error.message || error}`;
            outputChannel.appendLine(errorMsg);
            vscode.window.showErrorMessage(`❌ Erro na comunicação com a IA: ${error.message}`);
            throw error;
        }
    }
}
