import express from 'express';
import { getGeminiKey, normalizeProvider } from '../config.js';
import {
    compactAssistSchema,
    normalizeBlueprintForMcp,
    parseJsonSafely,
    truncateText,
    validatePlannerPayload
} from '../utils.js';

export function createAiRouter({ logger, modelClient, mcpService, storage }) {
    const router = express.Router();

    router.post('/ai/completion', async (req, res) => {
        try {
            const { provider, model, messages, config } = req.body;
            const result = await modelClient.callModel({ provider, model, messages, config });
            return res.json(result.raw);
        } catch (err) {
            logger.error('AI Proxy Error', { error: err.message, stack: err.stack });
            return res.status(500).json({ error: err.message });
        }
    });

    router.post('/api/ai/scaffold', async (req, res) => {
        const { prompt, provider, model, referenceFile } = req.body;
        const trimmedPrompt = String(prompt || '').trim();

        if (!trimmedPrompt && !referenceFile?.fileId) {
            return res.status(400).json({ error: 'Provide a prompt, a reference file, or both.' });
        }

        try {
            const mcpContext = await mcpService.getMcpScaffoldContext();
            let effectiveProvider = normalizeProvider(provider);
            const loadedReference = await storage.loadStoredReferenceFile(referenceFile);

            if (loadedReference?.mimeType === 'application/pdf' && effectiveProvider === 'openai') {
                if (!getGeminiKey()) {
                    return res.status(400).json({ error: 'PDF reference analysis in the demo proxy requires Gemini to be configured.' });
                }
                effectiveProvider = 'gemini';
            }

            let scaffoldPrompt = trimmedPrompt;
            let blueprint = null;
            let assumptions = [];
            let summary = '';

            if (loadedReference) {
                const systemInstruction = `You are helping an admin prepare the best possible blueprint for the Vant Flow MCP tool "scaffold_from_blueprint".

Your job is NOT to output a final Vant schema.
Your job is to study the admin instruction and optional uploaded form reference, then produce a structured blueprint that the Vant MCP tool can scaffold.
Use the MCP capabilities and contracts below instead of inventing your own schema dialect.

Return JSON only in this exact shape:
{
  "blueprint": {
    "title": "Human readable form title",
    "description": "Short description under 140 characters",
    "intro_text": "Optional short intro",
    "intro_color": "blue",
    "sections": [
      {
        "label": "Section label",
        "columns_count": 1,
        "fields": [
          {
            "label": "Field label",
            "fieldtype": "Data",
            "fieldname": "field_label_in_snake_case",
            "mandatory": true
          }
        ]
      }
    ]
  },
  "summary": "short explanation of the form that will be scaffolded",
  "assumptions": ["clear assumptions the admin should review"]
}

Rules:
- Treat the uploaded form as the primary source of truth for visible structure and labels unless the admin explicitly asks for extra fields.
- Build a concise blueprint, not a prose requirements essay.
- Keep labels short and human-readable.
- Do not return Markdown.
- Use the MCP field type guidance to choose the most specific valid Vant fieldtype for each field instead of defaulting to Data when the meaning is clear.
- Examples of specific typing: visible calendar/date field -> Date, date plus time -> Datetime, amount/currency/amount in figures -> Float, longer narrative text like reason/notes/amount in words -> Text, visible signature line -> Signature.
- Do not invent approvals, signatures, workflow steps, or sections that are not visible in the image unless the admin explicitly asks for them.
- Do not turn instructional sentences or decorative text into fields.
- If options are not visible or explicitly provided, prefer a Data field over inventing a Select list.
- If the form shows mutually exclusive printed choices, map them to a single Select field with only the visible options.
- Use Select only when the options are visible or clearly specified.
- Every Select field must include an "options" property as a newline-separated string.
- Use Table only when the image or prompt clearly implies repeating rows.
- Any Table field must include non-empty "table_fields", otherwise use a non-Table fieldtype instead.
- Use Attach and Signature only when the form genuinely calls for them.
- Any Attach or Signature field must use "data_group": "files".
- Prefer 1 to 3 sections unless the image clearly indicates a more complex structure.
- Keep description short enough for a compact form header.
- Keep the blueprint grounded in the actual Vant MCP capabilities, contracts, and examples below.`;

                const mcpGuidance = [
                    `MCP capabilities:\n${truncateText(JSON.stringify(mcpContext.capabilities || {}, null, 2), 2200)}`,
                    `MCP models and schema guidance:\n${truncateText(mcpContext.models, 2200)}`,
                    `MCP field type guidance:\n${truncateText(mcpContext.fieldTypes, 1800)}`,
                    `MCP renderer contract:\n${truncateText(mcpContext.rendererContract, 1200)}`,
                    `MCP builder contract:\n${truncateText(mcpContext.builderContract, 1200)}`,
                    `MCP example schema guidance:\n${truncateText(mcpContext.exampleSchemas, 1500)}`
                ].join('\n\n');

                const promptInstruction = trimmedPrompt
                    ? `Admin instruction: "${trimmedPrompt}".`
                    : 'No extra admin instruction was provided. Infer the likely form purpose from the uploaded reference.';
                const referenceInstruction = `Reference file: ${loadedReference.name} (${loadedReference.mimeType}). Study the visual structure and business intent carefully.`;

                const userContent = [
                    {
                        type: 'text',
                        text: [
                            'Prepare the best possible blueprint for Vant MCP.',
                            promptInstruction,
                            referenceInstruction,
                            'Keep the result faithful to the visible form structure and avoid inventing extra workflow. If the admin prompt is empty, infer only what is visible from the uploaded form and keep assumptions explicit. If the admin prompt adds extra requirements, merge them only when they do not conflict with the uploaded form.',
                            'Choose the strongest Vant field type supported by MCP when the field meaning is visually clear, and use generic Data only when the field semantics are genuinely unclear.',
                            'If anything is ambiguous, choose a sensible default and record it in the assumptions array.',
                            mcpGuidance
                        ].join('\n\n')
                    }
                ];

                if (loadedReference.mimeType === 'application/pdf') {
                    userContent.push({
                        type: 'input_file',
                        mimeType: loadedReference.mimeType,
                        data: loadedReference.base64
                    });
                } else if (loadedReference.mimeType?.startsWith('image/')) {
                    userContent.push({
                        type: 'image_url',
                        image_url: { url: loadedReference.dataUrl }
                    });
                }

                const result = await modelClient.callModel({
                    provider: effectiveProvider,
                    model,
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: userContent }
                    ],
                    config: { temperature: 0.1 }
                });

                const parsed = parseJsonSafely(result.content);
                const validation = validatePlannerPayload(parsed);

                if (!validation.ok) {
                    const invalidPayloadLog = {
                        reason: validation.reason,
                        rawResponse: result.content,
                        parsedPayload: parsed
                    };
                    logger.warn('AI scaffold planner returned invalid payload shape', invalidPayloadLog);
                    console.log('[AI Scaffold Planner Invalid Raw Response]');
                    console.log(result.content || '<empty>');
                    console.log('[AI Scaffold Planner Invalid Parsed Payload]');
                    console.log(JSON.stringify(parsed ?? null, null, 2));
                    return res.status(502).json({
                        error: `Model did not return a valid scaffold blueprint payload. ${validation.reason}`
                    });
                }

                blueprint = normalizeBlueprintForMcp(parsed.blueprint);
                assumptions = Array.isArray(parsed.assumptions)
                    ? parsed.assumptions.map(item => String(item)).filter(Boolean)
                    : [];
                summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';

                console.log('[AI Scaffold Planner Response]');
                console.log(JSON.stringify({
                    prompt: trimmedPrompt,
                    referenceFile: {
                        fileId: loadedReference.fileId,
                        name: loadedReference.name,
                        mimeType: loadedReference.mimeType,
                        size: loadedReference.size
                    },
                    provider_used: effectiveProvider,
                    blueprint,
                    assumptions,
                    summary
                }, null, 2));
            }

            const mcpResponse = blueprint
                ? await mcpService.callMcpTool('scaffold_from_blueprint', { blueprint })
                : await mcpService.callMcpTool('create_form_from_prompt', { prompt: scaffoldPrompt });
            const schema = parseJsonSafely(mcpResponse.text);

            if (!schema || typeof schema !== 'object') {
                logger.warn('Vant MCP returned non-JSON schema payload', { rawResponse: mcpResponse.text });
                console.log('[Vant MCP Invalid Schema]');
                console.log(mcpResponse.text || '<empty>');
                return res.status(502).json({
                    error: 'Vant MCP returned an invalid schema payload that could not be parsed as JSON.'
                });
            }

            const verifyResponse = await mcpService.callMcpTool('verify_schema', { schema });
            const verification = parseJsonSafely(verifyResponse.text);
            if (!verification || verification.valid !== true) {
                logger.warn('Vant MCP verify_schema failed', { verification, rawSchema: schema });
                console.log('[Vant MCP verify_schema Failure]');
                console.log(JSON.stringify({ verification, schema }, null, 2));
                return res.status(502).json({
                    error: `Vant MCP generated a schema that did not pass verify_schema.${Array.isArray(verification?.issues) && verification.issues.length ? ` ${verification.issues.join(' | ')}` : ''}`
                });
            }

            if (!summary) {
                summary = loadedReference
                    ? 'Generated a Vant Flow form from your instruction and uploaded form reference via Vant MCP.'
                    : 'Generated a Vant Flow form from your prompt via Vant MCP.';
            }

            if (assumptions.length === 0) {
                assumptions = loadedReference
                    ? [
                        'The uploaded form reference was interpreted into a structured blueprint before Vant MCP generated the schema.',
                        'Review section ordering, required fields, and any inferred defaults before saving.'
                    ]
                    : [
                        'The form was scaffolded from your natural-language instruction using Vant MCP.',
                        'Review field labels, required flags, and workflow order before saving.'
                    ];
            }

            schema.metadata = {
                ...(schema.metadata || {}),
                is_ai_generated: true,
                generated_from: trimmedPrompt || loadedReference?.name || scaffoldPrompt || 'reference-form',
                generated_via: 'proxy',
                generated_provider_used: effectiveProvider,
                generated_reference_name: loadedReference?.name,
                generated_scaffold_prompt: scaffoldPrompt,
                generated_blueprint: blueprint,
                ai_summary: summary,
                ai_assumptions: assumptions
            };

            const scaffoldDebugPayload = {
                prompt: trimmedPrompt,
                referenceFile: loadedReference ? {
                    fileId: loadedReference.fileId,
                    name: loadedReference.name,
                    mimeType: loadedReference.mimeType,
                    size: loadedReference.size
                } : null,
                provider_used: effectiveProvider,
                scaffold_prompt: scaffoldPrompt,
                blueprint,
                assumptions,
                schema
            };

            logger.info('AI scaffold generated', {
                provider: effectiveProvider,
                hasReferenceFile: !!loadedReference,
                assumptionsCount: assumptions.length,
                schemaName: schema.name
            });
            console.log('[AI Scaffold Response]');
            console.log(JSON.stringify(scaffoldDebugPayload, null, 2));

            return res.json({
                schema,
                summary,
                assumptions,
                provider_used: effectiveProvider
            });
        } catch (err) {
            logger.error('AI Scaffold Error', { error: err.message, stack: err.stack });
            return res.status(500).json({ error: err.message });
        }
    });

    router.post('/api/ai/assist', async (req, res) => {
        const { provider, model, messages, schema, currentData } = req.body;

        if (!schema || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages and schema are required.' });
        }

        const normalizedMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        const compactSchema = compactAssistSchema(schema);

        const systemInstruction = `You are an expert Vant Flow AI Assistant.
You are helping a user fill a live Vant Flow form.

Schema JSON Structure: ${JSON.stringify(compactSchema)}
CURRENT USER DATA STATE: ${JSON.stringify(currentData || {})}

You must only return valid JSON. No Markdown.

Return an object with this exact shape:
{
  "assistant_message": "short helpful explanation written in Markdown",
  "field_updates": { "fieldname": "value" },
  "table_updates": [
    { "fieldname": "table_fieldname", "mode": "append", "rows": [{ "column_fieldname": "value" }] }
  ],
  "actions": [
    { "type": "validate" },
    { "type": "save" },
    { "type": "submit" },
    { "type": "next_step" },
    { "type": "prev_step" },
    { "type": "goto_step", "step": 1 }
  ],
  "requires_manual_input": ["reason manual input is needed"]
}

Rules:
- Use exact schema fieldnames only.
- Use "field_updates" for normal fields.
- Use "table_updates" for Table rows.
- Use "append" to add rows and "replace" to overwrite a whole table.
- Only include "save" or "submit" if the user explicitly asks for it.
- Use "validate" if the user asks you to check or verify the form.
- If the user asks to attach a file or provide a real signature, do not fabricate it. Explain it in "requires_manual_input".
- The user-facing UI will render "assistant_message" as Markdown.
- If there is not enough information, leave updates empty and ask a concise follow-up question in "assistant_message".`;

        try {
            const result = await modelClient.callModel({
                provider,
                model,
                messages: [
                    { role: 'system', content: systemInstruction },
                    ...normalizedMessages
                ],
                config: { temperature: 0.1 }
            });

            const parsed = parseJsonSafely(result.content);
            if (!parsed || typeof parsed.assistant_message !== 'string') {
                return res.json({
                    assistant_message: result.content || 'I am sorry, I am unable to respond at this time.',
                    field_updates: {},
                    table_updates: [],
                    actions: [],
                    requires_manual_input: []
                });
            }

            return res.json({
                assistant_message: parsed.assistant_message,
                field_updates: parsed.field_updates || {},
                table_updates: parsed.table_updates || [],
                actions: parsed.actions || [],
                requires_manual_input: parsed.requires_manual_input || []
            });
        } catch (err) {
            logger.error('AI Assist Error', { error: err.message, stack: err.stack });
            return res.status(500).json({ error: err.message });
        }
    });

    return router;
}
