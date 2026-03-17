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
    // Uses the same field type knowledge as the Vant MCP's get_field_types tool.
    async scaffoldFormFromPrompt(prompt: string): Promise<DocumentDefinition> {
        if (!this.isAiEnabled() || !this.apiKey()) {
            return this.getMockedScaffoldResponse(prompt);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey() });

            // System instruction mirrors the Vant MCP get_field_types + create_form_from_prompt tools.
            // This IS the same source of truth that MCP-connected AI agents use.
            const systemInstruction = `You are an expert Vant Flow form architect. Vant Flow is a metadata-driven reactive form framework.

== ALL SUPPORTED FIELD TYPES ==
- Data: single-line text. Extra: regex
- Text: multi-line textarea
- Text Editor: rich Quill HTML editor
- Int: integer number
- Float: decimal number
- Select: dropdown. REQUIRED: options (newline-separated e.g. "A\\nB\\nC"). Extra: default
- Check: boolean checkbox. Stores 1 or 0.
- Date: date picker
- Datetime: date + time picker
- Time: time-only picker (HH:mm)
- Password: masked input
- Link: relational selector. Extra: options (doctype name)
- Attach: file upload. Extra: options as "<mime> | <maxSize> | <maxCount>" e.g. ".pdf,.docx | 10MB | 3". Always set data_group: "files"
- Signature: signature capture pad. Always set data_group: "files"
- Button: inline clickable button
- Table: repeating data grid. REQUIRED: table_fields[] each with id, fieldname, label, fieldtype. Supports all types except Table.

== FIELD PROPERTIES ==
Required per field: id (unique), fieldname (snake_case unique), label, fieldtype
Optional: mandatory, read_only, hidden, placeholder, description, default, regex, options, depends_on, data_group, table_fields

== DOCUMENT STRUCTURE EXAMPLE ==
{
  "name": "Form Name", "module": "Module", "version": "1.0.0",
  "description": "...", "intro_text": "<b>HTML</b> banner", "intro_color": "blue",
  "metadata": { "is_ai_generated": true },
  "sections": [
    {
      "id": "sec_1", "label": "Section", "columns_count": 2,
      "columns": [
        { "id": "col_1", "fields": [{ "id": "f_1", "fieldname": "field_name", "label": "Field", "fieldtype": "Data", "mandatory": true }] },
        { "id": "col_2", "fields": [] }
      ]
    }
  ],
  "actions": { "save": { "label": "Save Draft", "visible": true, "type": "secondary" }, "submit": { "label": "Submit", "visible": true, "type": "primary" } }
}

== GENERATION RULES ==
1. Analyze the prompt. Identify every entity/attribute the domain needs.
2. Create 3–5 well-named sections. Use columns_count: 2 for header sections.
3. Use Select with real options for any categorical field (status, type, priority, category).
4. Use Table for any repeating data (line items, expense rows, defect logs, etc.).
5. Use Attach for document/photo uploads, Signature for sign-off.
6. Use meaningful intro_text and customize actions.submit label for the domain.
7. All IDs must be unique. All fieldnames must be unique and snake_case.
8. Return ONLY raw valid JSON — no markdown, no explanation.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Create a complete, rich Vant Flow form schema for: "${prompt}"`,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                }
            });

            if (response.text) {
                const parsed = JSON.parse(response.text) as DocumentDefinition;
                parsed.metadata = { ...(parsed.metadata || {}), is_ai_generated: true, generated_from: prompt };
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
