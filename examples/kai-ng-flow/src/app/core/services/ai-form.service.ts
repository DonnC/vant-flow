import { Injectable, signal } from '@angular/core';
import { DocumentDefinition } from 'vant-flow';

export type AiProvider = 'gemini' | 'openai';

export interface AiAssistantTableUpdate {
    fieldname: string;
    mode?: 'append' | 'replace';
    rows: Record<string, any>[];
}

export interface AiAssistantAction {
    type: 'validate' | 'save' | 'submit' | 'next_step' | 'prev_step' | 'goto_step';
    step?: number | string;
}

export interface AiAssistantResponse {
    assistant_message: string;
    field_updates?: Record<string, any>;
    table_updates?: AiAssistantTableUpdate[];
    actions?: AiAssistantAction[];
    requires_manual_input?: string[];
}

@Injectable({ providedIn: 'root' })
export class AiFormService {
    isAiEnabled = signal<boolean>(true);
    selectedProvider = signal<AiProvider>('openai');
    private readonly CHAT_API_URL = 'http://localhost:3002/api/chat';
    private readonly AI_API_URL = 'http://localhost:3002/api/ai';

    private async postJson<T>(url: string, payload: any): Promise<T> {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `AI Proxy Error: ${response.statusText}`);
        }
        return await response.json() as T;
    }

    async scaffoldFormFromPrompt(prompt: string): Promise<DocumentDefinition> {
        if (!this.isAiEnabled()) {
            return this.getMockedScaffoldResponse(prompt);
        }

        try {
            return await this.postJson<DocumentDefinition>(`${this.AI_API_URL}/scaffold`, {
                prompt,
                provider: this.selectedProvider()
            });
        } catch (err) {
            console.error("Scaffold Generation failed:", err);
            throw err;
        }
    }

    private async getMockedScaffoldResponse(prompt: string): Promise<DocumentDefinition> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    name: `AI Mock Form: ${prompt.slice(0, 15)}...`,
                    description: `This is a mocked form payload. Run 'npm run example:proxy' to use real AI.`,
                    version: '1.0.0',
                    metadata: { is_ai_generated: true, mocked: true, generated_from: prompt },
                    sections: [{
                        id: 'section_ai_mock_1',
                        label: 'Basic Information',
                        columns: [{
                            id: 'col_mock_1',
                            fields: [
                                {
                                    id: 'field_mock_1',
                                    fieldname: 'mock_field',
                                    label: 'Example Field: ' + prompt,
                                    fieldtype: 'Data',
                                    mandatory: true,
                                }
                            ]
                        }]
                    }]
                });
            }, 1000);
        });
    }

    async getChatFormAssistance(messages: { role: 'user' | 'model' | 'assistant', content: string }[], schema: DocumentDefinition, currentData: any): Promise<AiAssistantResponse> {
        if (!this.isAiEnabled()) {
            return {
                assistant_message: `[MOCK AI]: I see you are asking about ${schema.name}. Please configure an API Key to get real help.`
            };
        }

        try {
            return await this.postJson<AiAssistantResponse>(`${this.AI_API_URL}/assist`, {
                provider: this.selectedProvider(),
                messages,
                schema,
                currentData
            });
        } catch (err) {
            console.error("AI Chat failed:", err);
            return {
                assistant_message: "[AI Error] Interaction failed via proxy.",
                field_updates: {},
                table_updates: [],
                actions: [],
                requires_manual_input: []
            };
        }
    }

    // --- Persistent Chat History ---

    async getChatHistory(formId: string): Promise<any[]> {
        try {
            const response = await fetch(`${this.CHAT_API_URL}/${formId}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (err) {
            console.error('[AiFormService] Failed to fetch chat history:', err);
            return [];
        }
    }

    async saveChatMessage(formId: string, role: string, content: string) {
        try {
            await fetch(`${this.CHAT_API_URL}/${formId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, content, timestamp: new Date().toISOString() })
            });
        } catch (err) {
            console.error('[AiFormService] Failed to save chat message:', err);
        }
    }

    async deleteChatHistory(formId: string) {
        try {
            await fetch(`${this.CHAT_API_URL}/${formId}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.error('[AiFormService] Failed to clear chat history:', err);
        }
    }
}
