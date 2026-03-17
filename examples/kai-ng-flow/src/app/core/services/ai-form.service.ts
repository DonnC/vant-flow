import { Injectable, signal, computed } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
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

    // Computed for UI compatibility
    apiKey = computed(() => {
        return this.selectedProvider() === 'gemini' ? this.geminiKey() : this.openAiKey();
    });

    private mcpClient: Client | null = null;

    constructor() {
        // Automatically enable if keys are present in environment
        if (this.geminiKey() || this.openAiKey()) {
            this.isAiEnabled.set(true);
            // Default to OpenAI if key is present, otherwise Gemini
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
    async callMcpTool(name: string, args: any) {
        if (!this.mcpClient || !this.isMcpConnected()) {
            throw new Error("MCP server not connected");
        }
        try {
            console.log(`[MCP] Calling tool: ${name}`, args);
            const response = await this.mcpClient.callTool({
                name,
                arguments: args
            });

            const toolResult = response as any;
            if (toolResult.isError) {
                const errorText = toolResult.content?.[0]?.type === 'text' ? toolResult.content[0].text : 'Unknown error';
                throw new Error(errorText);
            }

            const text = toolResult.content?.[0]?.type === 'text' ? toolResult.content[0].text : '';
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        } catch (err: any) {
            console.error(`[MCP] Tool call failed: ${name}`, err);
            throw err;
        }
    }

    // 1. Admin Function: Scaffold Form from Prompt
    async scaffoldFormFromPrompt(prompt: string): Promise<DocumentDefinition> {
        if (!this.isAiEnabled()) {
            // Even if AI disabled, if MCP is connected, we can use the 'create_form_from_prompt' tool 
            // but that tool in the server usually requires AI context. 
            // So we fallback to mock if AI is off.
            return this.getMockedScaffoldResponse(prompt);
        }

        const provider = this.selectedProvider();

        // If MCP is connected, we fetch the dynamic guidance from the server
        let systemInstruction = "";
        if (this.isMcpConnected()) {
            try {
                const res = await this.callMcpTool("create_form_from_prompt", { prompt });
                // Note: The MCP server's 'create_form_from_prompt' currently returns "Instructional text"
                // which includes the full schema reference.
                systemInstruction = typeof res === 'string' ? res : JSON.stringify(res);
            } catch (e) {
                console.warn("[MCP] Failed to get guidance from live server, using fallback prompt.");
                systemInstruction = this.getFallbackSystemInstruction();
            }
        } else {
            systemInstruction = this.getFallbackSystemInstruction();
        }

        try {
            if (provider === 'gemini') {
                return await this.generateWithGemini(prompt, systemInstruction);
            } else {
                return await this.generateWithOpenAi(prompt, systemInstruction);
            }
        } catch (err: any) {
            console.error(`${provider} Generation failed:`, err);
            throw new Error(`${provider} generation failed: ${err.message}`);
        }
    }

    private getFallbackSystemInstruction(): string {
        return `You are an expert Vant Flow form architect. Use the Vant Flow metadata patterns. 
        Fieldtypes: Data, Text, Text Editor, Int, Float, Select, Check, Date, Datetime, Time, Password, Link, Attach, Signature, Button, Table.
        Return ONLY valid JSON.`;
    }

    private async generateWithGemini(prompt: string, systemInstruction: string): Promise<DocumentDefinition> {
        const ai = new GoogleGenAI({ apiKey: this.geminiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: `Create a complete, rich Vant Flow form schema for: "${prompt}"\n\nContext:\n${systemInstruction}` }] }],
            config: {
                responseMimeType: 'application/json',
            }
        });

        if (response.text) {
            const parsed = JSON.parse(response.text) as DocumentDefinition;
            parsed.metadata = { ...(parsed.metadata || {}), is_ai_generated: true, generated_from: prompt };
            return parsed;
        }
        throw new Error("Gemini returned empty response");
    }

    private async generateWithOpenAi(prompt: string, systemInstruction: string): Promise<DocumentDefinition> {
        const openai = new OpenAI({ apiKey: this.openAiKey(), dangerouslyAllowBrowser: true });

        // Define the tool for OpenAI if we want to use function calling
        const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
            {
                type: 'function',
                function: {
                    name: 'scaffold_form',
                    description: 'Generate the final Vant Flow form schema',
                    parameters: {
                        type: 'object',
                        properties: {
                            schema: { type: 'object', description: 'The Vant DocumentDefinition JSON' }
                        },
                        required: ['schema']
                    }
                }
            }
        ];

        const completion = await openai.chat.completions.create({
            model: this.openAiModel(),
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: `Create a complete, rich Vant Flow form schema for: "${prompt}"` }
            ],
            tools,
            tool_choice: { type: 'function', function: { name: 'scaffold_form' } }
        });

        const toolCall = completion.choices[0].message.tool_calls?.[0];
        if (toolCall && 'function' in toolCall) {
            const args = JSON.parse(toolCall.function.arguments);
            const parsed = args.schema as DocumentDefinition;
            parsed.metadata = { ...(parsed.metadata || {}), is_ai_generated: true, generated_from: prompt };
            return parsed;
        }
        throw new Error("OpenAI returned empty response");
    }

    private async getMockedScaffoldResponse(prompt: string): Promise<DocumentDefinition> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    name: `AI Mock Form: ${prompt.slice(0, 15)}...`,
                    description: `This is a mocked form payload. Configure an API key in the .env file to use real AI.`,
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
                                    label: 'Example Field based on: ' + prompt,
                                    fieldtype: 'Data',
                                    mandatory: true,
                                    description: 'This is a mocked output.'
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
        let context = "";

        // Fetch field types info from MCP if possible
        if (this.isMcpConnected()) {
            try {
                context = await this.callMcpTool("get_field_types", {});
            } catch { }
        }

        const systemInstruction = `You are an expert Vant Flow AI Assistant. 
Schema JSON Structure: ${JSON.stringify(schema)}
CURRENT USER DATA STATE: ${JSON.stringify(currentData)}
Field Context: ${context}

Assist the user in filling out this dynamic form.`;

        try {
            if (provider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey: this.geminiKey() });
                const history = messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' as const : m.role as 'user' | 'model',
                    parts: [{ text: m.content }]
                }));

                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: history,
                    config: { systemInstruction: systemInstruction }
                });

                return response.text || 'I am sorry, I am unable to respond at this time.';
            } else {
                const openai = new OpenAI({ apiKey: this.openAiKey(), dangerouslyAllowBrowser: true });
                const chatHistory = messages.map(m => ({
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content
                }));

                const completion = await openai.chat.completions.create({
                    model: this.openAiModel(),
                    messages: [
                        { role: 'system', content: systemInstruction },
                        ...chatHistory
                    ]
                });

                return completion.choices[0].message.content || 'I am sorry, I am unable to respond at this time.';
            }
        } catch (err) {
            console.error("AI Chat failed:", err);
            return "[AI Error] Interaction failed. Check console logger.";
        }
    }
}
