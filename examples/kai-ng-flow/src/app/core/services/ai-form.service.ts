import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { DocumentDefinition } from 'vant-flow';

@Injectable({ providedIn: 'root' })
export class AiFormService {
    // Basic service state
    isAiEnabled = signal<boolean>(false);
    apiKey = signal<string>('');

    // Configure this with an API key
    setupRealModel(key: string) {
        this.apiKey.set(key);
        this.isAiEnabled.set(true);
    }

    disableRealModel() {
        this.apiKey.set('');
        this.isAiEnabled.set(false);
    }

    // 1. Admin Function: Scaffold Form from Prompt
    async scaffoldFormFromPrompt(prompt: string): Promise<DocumentDefinition> {
        if (!this.isAiEnabled() || !this.apiKey()) {
            return this.getMockedScaffoldResponse(prompt);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey() });
            const SC_PROMPT = `You are a Vant Flow expert. Create a detailed form schema (DocumentDefinition) based on exactly what the user needs: "${prompt}". 
Respond ONLY with raw, valid JSON conforming to the Vant Flow DocumentDefinition interface. Do NOT wrap it in markdown.`;

            // Note: We use structured outputs here so the AI guarantees returning what we expect.
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: SC_PROMPT,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            version: { type: Type.STRING },
                            metadata: { type: Type.OBJECT },
                            sections: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        label: { type: Type.STRING },
                                        columns: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    id: { type: Type.STRING },
                                                    fields: {
                                                        type: Type.ARRAY,
                                                        items: {
                                                            type: Type.OBJECT,
                                                            properties: {
                                                                id: { type: Type.STRING },
                                                                fieldname: { type: Type.STRING },
                                                                label: { type: Type.STRING },
                                                                fieldtype: { type: Type.STRING }
                                                            },
                                                            required: ['id', 'fieldname', 'label', 'fieldtype']
                                                        }
                                                    }
                                                },
                                                required: ['id', 'fields']
                                            }
                                        }
                                    },
                                    required: ['id', 'label', 'columns']
                                }
                            }
                        },
                        required: ['name', 'sections']
                    }
                }
            });

            if (response.text) {
                const parsed = JSON.parse(response.text) as DocumentDefinition;
                parsed.metadata = { is_ai_generated: true, generated_from: prompt };
                return parsed;
            } else {
                throw new Error("AI returned empty response");
            }

        } catch (err: any) {
            console.error("AI Generation failed:", err);
            throw new Error(`AI generation failed: ${err.message}`);
        }
    }

    private async getMockedScaffoldResponse(prompt: string): Promise<DocumentDefinition> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    name: `AI Mock Form: ${prompt.slice(0, 15)}...`,
                    description: `This is a mocked form payload generated from your prompt: "${prompt}". Configure a real API key to use real AI.`,
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
    async getChatFormAssistance(messages: { role: 'user' | 'model', content: string }[], schema: DocumentDefinition, currentData: any): Promise<string> {
        if (!this.isAiEnabled() || !this.apiKey()) {
            return `[MOCK AI]: I see you are asking about ${schema.name}. Please configure a real Gemini API Key in the settings to get real help.`;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey() });

            // Very explicit system prompt telling it what Vant is
            const systemInstruction = `You are an expert Vant Flow AI Assistant. Vant Flow is a metadata-driven reactive form builder designed for complex business logic, inspired by the Frappe framework. It uses JSON schemas to define fields and client-side JavaScript for dynamic behavior.
             
             You have complete knowledge of form schemas, validation rules, and business process definitions. Your primary goal is to assist the user in filling out this dynamic form accurately and efficiently, or advise them on how to construct their business data.
             
             You have access to the current Form Schema (DocumentDefinition) and the current state of the filled data (formData).
             
             When the user asks a question, explain the requirements of the fields clearly based on your deep understanding of enterprise forms. If the user asks you to fill out the form based on a description or a prompt, you must generate the corresponding JSON payload that strictly adheres to the schema's field types, constraints (like regex or mandatory flags), and data groupings. You understand advanced interactions like tables and will format rows logically.
             
             Only output the specific fields you intend to update. Be conversational, helpful, and proactive in inferring data from user context.
             
             CURRENT FORM CONTEXT:
             Schema Name: ${schema.name}
             Schema JSON Structure: ${JSON.stringify(schema)}
             
             CURRENT USER DATA STATE:
             ${JSON.stringify(currentData)}
             `;

            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: history,
                config: { systemInstruction: systemInstruction }
            });

            return response.text || 'I am sorry, I am unable to respond at this time.';
        } catch (err) {
            console.error("AI Chat failed:", err);
            return "[AI Error] Interaction failed. Check console logger.";
        }
    }
}
