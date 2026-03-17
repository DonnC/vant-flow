import { Injectable, signal, computed } from '@angular/core';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { DocumentDefinition } from 'vant-flow';
import { aiConfig } from '../../../environments/environment.ai';

export type AiProvider = 'gemini' | 'openai';

@Injectable({ providedIn: 'root' })
export class AiFormService {
    // Basic service state
    isAiEnabled = signal<boolean>(false);
    isMcpConnected = signal<boolean>(false);

    // Config from environment
    config = aiConfig;

    // Selection state
    selectedProvider = signal<AiProvider>('gemini');

    // Keys (can still be overridden manually if needed)
    geminiKey = signal<string>(aiConfig.geminiApiKey || '');
    openAiKey = signal<string>(aiConfig.openAiKey || '');
    openAiModel = signal<string>(aiConfig.openAiModel || 'gpt-4o-mini-2024-07-18');
    mcpUrl = signal<string>(aiConfig.mcpServerUrl || 'http://localhost:3001/sse');
    proxyUrl = signal<string>('http://localhost:3002/ai/completion');

    // Computed for UI compatibility
    apiKey = computed(() => {
        return this.selectedProvider() === 'gemini' ? this.geminiKey() : this.openAiKey();
    });

    private mcpClient: Client | null = null;

    constructor() {
        // Automatically enable if keys are present in environment
        if (this.geminiKey() || this.openAiKey()) {
            this.isAiEnabled.set(true);
            if (this.openAiKey()) {
                this.selectedProvider.set('openai');
            } else {
                this.selectedProvider.set('gemini');
            }
        }

        // Initialize MCP connection if URL is provided
        if (this.mcpUrl()) {
            this.connectToMcp();
        }
    }

    private async connectToMcp() {
        try {
            console.log(`[MCP] Connecting to live server at ${this.mcpUrl()}...`);
            const transport = new SSEClientTransport(new URL(this.mcpUrl()));
            this.mcpClient = new Client(
                { name: "vant-flow-client", version: "1.0.0" },
                { capabilities: {} }
            );

            await this.mcpClient.connect(transport);
            this.isMcpConnected.set(true);
            console.log("[MCP] Connected to live Vant MCP server successfully!");
        } catch (err) {
            console.warn("[MCP] Failed to connect to live MCP server. Falling back to local/static logic.", err);
            this.isMcpConnected.set(false);
        }
    }

    // Manual setup (UI support)
    setupRealModel(key: string, provider: AiProvider = 'gemini') {
        if (!key) return;
        if (provider === 'gemini') {
            this.geminiKey.set(key);
        } else {
            this.openAiKey.set(key);
        }
        this.selectedProvider.set(provider);
        this.isAiEnabled.set(true);
    }

    disableRealModel() {
        this.isAiEnabled.set(false);
    }

    // List available tools from the live MCP server
    async getMcpTools() {
        if (!this.mcpClient || !this.isMcpConnected()) return [];
        try {
            const response = await this.mcpClient.listTools();
            return response.tools;
        } catch (err) {
            console.error("[MCP] Failed to list tools:", err);
            return [];
        }
    }

    // Call a tool on the live MCP server
    async callMcpTool(name: string, args: any): Promise<any> {
        if (!this.mcpClient || !this.isMcpConnected()) {
            throw new Error("MCP server is not connected.");
        }
        console.log(`[MCP] Calling tool: ${name}`, args);
        try {
            const result = await this.mcpClient.callTool({ name, arguments: args });
            if (result.isError) {
                const errorText = (result.content as any)[0].type === 'text' ? (result.content as any)[0].text : 'Tool error';
                throw new Error(errorText);
            }
            return result;
        } catch (err: any) {
            console.error(`[MCP] Tool call failed: ${name}`, err);
            throw err;
        }
    }

    /**
     * CENTRALIZED AI CALL VIA PROXY
     */
    private async callAiProxy(messages: any[], config: any = {}): Promise<any> {
        const provider = this.selectedProvider();
        const response = await fetch(this.proxyUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                model: provider === 'openai' ? this.openAiModel() : 'gemini-1.5-flash',
                messages,
                config
            })
        });
        if (!response.ok) throw new Error('AI Proxy Error: ' + response.statusText);
        return await response.json();
    }

    // 1. User Function: Generates a complete form definition from a prompt
    async scaffoldFormFromPrompt(prompt: string): Promise<DocumentDefinition> {
        if (!this.isAiEnabled()) {
            return this.getMockedScaffoldResponse(prompt);
        }

        // Check if MCP is connected to get real-time guidance
        let guidance = '';
        if (this.isMcpConnected()) {
            try {
                const res = await this.callMcpTool('create_form_from_prompt', { prompt });
                guidance = res.content[0].text;
            } catch { }
        }

        const systemInstruction = `You are an expert Vant Flow architect. 
${guidance ? `LIVE MCP GUIDANCE:\n${guidance}\n` : `FIELD TYPES:\n${this.getFieldTypeCatalog()}\n`}
Available 'frm' API:\n${this.getFrmApiDocs()}\n
Task: Create a JSON DocumentDefinition for: "${prompt}". 
Only return the JSON. No Markdown.`;

        try {
            const data = await this.callAiProxy([
                { role: 'system', content: systemInstruction },
                { role: 'user', content: `Create a complete, rich Vant Flow form schema for: "${prompt}"` }
            ]);

            const content = data.choices[0].message.content || '{}';
            const parsed = JSON.parse(content.replace(/```json|```/g, '').trim()) as DocumentDefinition;
            parsed.metadata = { ...(parsed.metadata || {}), is_ai_generated: true, generated_from: prompt };
            return parsed;
        } catch (err) {
            console.error("Scaffold Generation failed:", err);
            throw err;
        }
    }

    private getFieldTypeCatalog(): string {
        return "Data, Text, Text Editor, Int, Float, Select, Check, Date, Datetime, Time, Password, Link, Attach, Signature, Button, Table.";
    }

    private getFrmApiDocs(): string {
        return "frm.get_value, frm.set_value, frm.set_df_property, frm.msgprint, frm.set_intro, frm.add_custom_button, frm.prompt, frm.confirm, frm.call";
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

    // 2. User Function: Assist in filling fields
    async getChatFormAssistance(messages: { role: 'user' | 'model' | 'assistant', content: string }[], schema: DocumentDefinition, currentData: any): Promise<string> {
        if (!this.isAiEnabled()) {
            return `[MOCK AI]: I see you are asking about ${schema.name}. Please configure an API Key to get real help.`;
        }

        const provider = this.selectedProvider();
        let fieldContext = "";

        if (this.isMcpConnected()) {
            try {
                const res = await this.callMcpTool("get_field_types", {});
                fieldContext = res.content[0].text;
            } catch { }
        }

        const systemInstruction = `You are an expert Vant Flow AI Assistant. 
Schema JSON Structure: ${JSON.stringify(schema)}
CURRENT USER DATA STATE: ${JSON.stringify(currentData)}
Field Context: ${fieldContext}

Assist the user in filling out this dynamic form.`;

        try {
            const chatHistory = messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }));

            const data = await this.callAiProxy([
                { role: 'system', content: systemInstruction },
                ...chatHistory
            ]);

            return data.choices[0].message.content || 'I am sorry, I am unable to respond at this time.';
        } catch (err) {
            console.error("AI Chat failed:", err);
            return "[AI Error] Interaction failed via proxy. Check console.";
        }
    }
}
