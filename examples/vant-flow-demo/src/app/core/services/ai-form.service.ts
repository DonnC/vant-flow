import { Injectable, signal } from '@angular/core';
import { DocumentDefinition } from 'vant-flow';

export type AiProvider = 'gemini' | 'openai';

export interface AiScaffoldReferenceFile {
    fileId: string;
    name: string;
    type: string;
    size?: number;
    publicUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
}

export interface AiScaffoldRequest {
    prompt?: string;
    referenceFile?: AiScaffoldReferenceFile | null;
}

export interface AiScaffoldResponse {
    schema: DocumentDefinition;
    assumptions: string[];
    summary: string;
    provider_used: AiProvider;
}

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
    private readonly MAX_ASSIST_MESSAGES = 8;
    private readonly MAX_STRING_PREVIEW = 280;
    private readonly MAX_TABLE_ROWS = 12;

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

    async scaffoldFormFromPrompt(request: AiScaffoldRequest): Promise<AiScaffoldResponse> {
        const prompt = String(request.prompt || '').trim();
        const referenceFile = request.referenceFile || null;

        if (!this.isAiEnabled()) {
            return this.getMockedScaffoldResponse(prompt, referenceFile);
        }

        try {
            return await this.postJson<AiScaffoldResponse>(`${this.AI_API_URL}/scaffold`, {
                prompt,
                referenceFile,
                provider: this.selectedProvider()
            });
        } catch (err) {
            console.error("Scaffold Generation failed:", err);
            throw err;
        }
    }

    private async getMockedScaffoldResponse(prompt: string, referenceFile: AiScaffoldReferenceFile | null): Promise<AiScaffoldResponse> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const assumptions = [
                    referenceFile ? `Used ${referenceFile.type === 'application/pdf' ? 'PDF' : 'image'} reference "${referenceFile.name}" as a layout hint.` : 'No reference file was provided.',
                    prompt ? 'Used the typed instruction as the main source of business intent.' : 'Inferred intent from the uploaded form reference only.'
                ];

                resolve({
                    schema: {
                        name: `AI Mock Form: ${(prompt || referenceFile?.name || 'Untitled Form').slice(0, 24)}...`,
                        description: `This is a mocked form payload. Run 'npm run example:proxy' to use real AI.`,
                        version: '1.0.0',
                        metadata: {
                            is_ai_generated: true,
                            mocked: true,
                            generated_from: prompt || referenceFile?.name || 'mock-ai',
                            ai_assumptions: assumptions,
                            ai_summary: referenceFile
                                ? 'Mock AI used the uploaded form reference plus your instruction to scaffold a draft.'
                                : 'Mock AI used your text instruction to scaffold a draft.',
                            generated_reference_name: referenceFile?.name,
                            generated_provider_used: this.selectedProvider()
                        },
                        sections: [{
                            id: 'section_ai_mock_1',
                            label: 'Basic Information',
                            columns: [{
                                id: 'col_mock_1',
                                fields: [
                                    {
                                        id: 'field_mock_1',
                                        fieldname: 'mock_field',
                                        label: 'Example Field: ' + (prompt || referenceFile?.name || 'Uploaded form'),
                                        fieldtype: 'Data',
                                        mandatory: true,
                                    }
                                ]
                            }]
                        }]
                    },
                    assumptions,
                    summary: referenceFile
                        ? 'Mock AI drafted a form from your prompt and uploaded reference.'
                        : 'Mock AI drafted a form from your text prompt.',
                    provider_used: this.selectedProvider()
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
                messages: this.compactMessages(messages),
                schema: this.compactSchema(schema),
                currentData: this.compactValue(currentData)
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

    private compactMessages(messages: { role: 'user' | 'model' | 'assistant', content: string }[]) {
        return messages.slice(-this.MAX_ASSIST_MESSAGES).map(message => ({
            role: message.role,
            content: this.compactText(message.content, 1200)
        }));
    }

    private compactSchema(schema: DocumentDefinition) {
        return {
            name: schema.name,
            description: schema.description,
            is_stepper: !!schema.is_stepper,
            intro_text: schema.intro_text,
            actions: schema.actions,
            metadata: schema.metadata,
            has_client_script: !!schema.client_script,
            steps: (schema.steps || []).map(step => ({
                id: step.id,
                title: step.title,
                description: step.description,
                sections: step.sections.map(section => this.compactSection(section))
            })),
            sections: (schema.sections || []).map(section => this.compactSection(section))
        };
    }

    private compactSection(section: any) {
        return {
            id: section.id,
            label: section.label,
            description: section.description,
            depends_on: section.depends_on,
            fields: (section.columns || []).flatMap((column: any) =>
                (column.fields || []).map((field: any) => this.compactField(field))
            )
        };
    }

    private compactField(field: any) {
        return {
            fieldname: field.fieldname,
            fieldtype: field.fieldtype,
            label: field.label,
            mandatory: !!(field.mandatory || field.reqd),
            read_only: !!field.read_only,
            hidden: !!field.hidden,
            depends_on: field.depends_on,
            mandatory_depends_on: field.mandatory_depends_on,
            placeholder: field.placeholder,
            options: this.compactOptions(field.options),
            data_group: field.data_group,
            link_config: field.link_config ? {
                data_source: field.link_config.data_source,
                mapping: field.link_config.mapping,
                filters: field.link_config.filters
            } : undefined,
            table_fields: Array.isArray(field.table_fields)
                ? field.table_fields.map((column: any) => ({
                    fieldname: column.fieldname,
                    fieldtype: column.fieldtype,
                    label: column.label,
                    mandatory: !!column.mandatory,
                    options: this.compactOptions(column.options)
                }))
                : undefined
        };
    }

    private compactOptions(options: any) {
        if (typeof options !== 'string') return options;
        if (options.length <= 160) return options;
        const normalized = options.split('\n').slice(0, 8).join('\n');
        return `${normalized}\n...`;
    }

    private compactValue(value: any): any {
        if (value == null) return value;

        if (typeof value === 'string') {
            return this.compactScalarString(value);
        }

        if (Array.isArray(value)) {
            return value.slice(0, this.MAX_TABLE_ROWS).map(item => this.compactValue(item));
        }

        if (typeof value === 'object') {
            const output: Record<string, any> = {};
            for (const [key, nestedValue] of Object.entries(value)) {
                output[key] = this.compactValue(nestedValue);
            }
            return output;
        }

        return value;
    }

    private compactScalarString(value: string, maxLength = this.MAX_STRING_PREVIEW) {
        if (value.startsWith('data:')) {
            return '[media payload omitted for AI speed]';
        }

        if (value.length > maxLength) {
            return `${value.slice(0, maxLength)}...`;
        }

        return value;
    }

    private compactText(value: string, maxLength: number) {
        if (!value) return value;
        return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
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
