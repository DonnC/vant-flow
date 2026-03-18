import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Logging System ---
const LOG_DIR = path.resolve(__dirname, 'logs');
const PROXY_LOG_FILE = path.join(LOG_DIR, 'proxy.log');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logToDisk(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...(data ? { data } : {})
    };
    const logString = JSON.stringify(logEntry) + '\n';

    // Console output for developer visibility
    const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}[${level}] ${timestamp}: ${message}\x1b[0m`);
    if (data && level === 'ERROR') console.error(data);

    fs.appendFileSync(PROXY_LOG_FILE, logString);
}

const logger = {
    info: (msg, data) => logToDisk('INFO', msg, data),
    warn: (msg, data) => logToDisk('WARN', msg, data),
    error: (msg, data) => logToDisk('ERROR', msg, data)
};
const envPath = path.resolve(__dirname, '../../../.env');
console.log(`[AI Proxy] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Initialization ---
const dbPath = path.resolve(__dirname, 'vant_flow.db');
let db;

async function initDb() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS forms (
            id TEXT PRIMARY KEY,
            schema TEXT,
            lastModified TEXT
        );

        CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            formId TEXT,
            formName TEXT,
            timestamp TEXT,
            data TEXT,
            metadata TEXT
        );

        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            formId TEXT,
            role TEXT,
            content TEXT,
            timestamp TEXT
        );
    `);
    console.log(`[AI Proxy] SQLite Database initialized at ${dbPath}`);
}

initDb().catch(err => {
    logger.error('DB Init Failed', err);
});

// Startup Check
const startupOpenAiKey = process.env.OPENAI_API_KEY?.trim() || process.env.OPEN_AI_KEY?.trim();
const startupGeminiKey = process.env.GEMINI_API_KEY?.trim();
logger.info('Startup Key Check:');
logger.info(` - OpenAI: ${startupOpenAiKey ? 'OK (ends with ' + startupOpenAiKey.slice(-4) + ')' : 'MISSING'}`);
logger.info(` - Gemini: ${startupGeminiKey ? 'OK (ends with ' + startupGeminiKey.slice(-4) + ')' : 'MISSING'}`);

const PORT = 3002;

function getOpenAiKey() {
    return process.env.OPENAI_API_KEY?.trim() || process.env.OPEN_AI_KEY?.trim() || null;
}

function getGeminiKey() {
    return process.env.GEMINI_API_KEY?.trim() || null;
}

function getDefaultModel(provider, requestedModel) {
    if (provider === 'openai') return requestedModel || process.env.OPEN_AI_MODEL || 'gpt-4o-mini-2024-07-18';
    return requestedModel || 'gemini-1.5-flash';
}

function normalizeProvider(provider) {
    return provider || process.env.AI_PROVIDER || 'openai';
}

function extractJsonObject(content) {
    if (!content) return null;
    const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) return fenced[1];
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    return content.slice(firstBrace, lastBrace + 1);
}

function parseJsonSafely(content) {
    const candidate = extractJsonObject(content) || content;
    try {
        return JSON.parse(candidate.trim());
    } catch {
        return null;
    }
}

function buildFieldCatalog() {
    return "Data, Text, Text Editor, Int, Float, Select, Check, Date, Datetime, Time, Password, Link, Attach, Signature, Button, Table.";
}

function buildFrmApiDocs() {
    return "frm.get_value, frm.set_value, frm.set_df_property, frm.msgprint, frm.set_intro, frm.add_custom_button, frm.prompt, frm.confirm, frm.call, frm.add_row, frm.remove_row, frm.next_step, frm.prev_step, frm.go_to_step";
}

async function callModel({ provider: requestedProvider, model: requestedModel, messages, config = {} }) {
    const provider = normalizeProvider(requestedProvider);
    const key = provider === 'openai' ? getOpenAiKey() : getGeminiKey();

    if (!key) {
        throw new Error(`API Key for ${provider} is missing in .env`);
    }

    logger.info(`Incoming completion request`, { provider, messagesCount: messages.length });

    if (provider === 'openai') {
        const client = new OpenAI({ apiKey: key });
        const completion = await client.chat.completions.create({
            model: getDefaultModel(provider, requestedModel),
            messages,
            ...config
        });
        const content = completion.choices[0].message.content;
        logger.info(`OpenAI completion successful`, { responseSnippet: content ? content.substring(0, 100) + '...' : 'EMPTY' });
        return {
            provider,
            content: content || '',
            raw: completion
        };
    }

    const genAI = new GoogleGenerativeAI(key);
    const geminiModel = genAI.getGenerativeModel({ model: getDefaultModel(provider, requestedModel) });
    const prompt = messages.map(m => `${String(m.role || 'user').toUpperCase()}:\n${m.content}`).join('\n\n');
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    logger.info(`Gemini completion successful`, { responseSnippet: content ? content.substring(0, 100) + '...' : 'EMPTY' });
    return {
        provider,
        content: content || '',
        raw: {
            choices: [{ message: { content } }]
        }
    };
}

// --- AI Completion Endpoint ---
app.post('/ai/completion', async (req, res) => {
    try {
        const { provider, model, messages, config } = req.body;
        const result = await callModel({ provider, model, messages, config });
        return res.json(result.raw);
    } catch (err) {
        logger.error('AI Proxy Error', { error: err.message, stack: err.stack });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ai/scaffold', async (req, res) => {
    const { prompt, provider, model } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    const systemInstruction = `You are an expert Vant Flow architect.
Field Types:
${buildFieldCatalog()}

Available frm API:
${buildFrmApiDocs()}

Generate forms that match what Vant Flow actually supports today:
- Use stepper flows for onboarding, approvals, and multi-stage capture.
- Use Table for line items, checklists, defect logs, votes, and approval matrices.
- Use Signature for explicit sign-off steps, approver acknowledgment, or auditor confirmation.
- Use Attach for evidence and supporting documents.
- Do not invent nested tables or unsupported widgets.
- If a prompt mentions approval, review, sign-off, committee, or authorization, include a clear review/signature area.

Task: Create a JSON DocumentDefinition for: "${prompt}".
Only return the JSON. No Markdown.`;

    try {
        const result = await callModel({
            provider,
            model,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: `Create a complete, rich Vant Flow form schema for: "${prompt}"` }
            ],
            config: { temperature: 0.2 }
        });

        const parsed = parseJsonSafely(result.content);
        if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string') {
            return res.status(502).json({ error: 'Model did not return a valid DocumentDefinition JSON payload.' });
        }

        parsed.metadata = {
            ...(parsed.metadata || {}),
            is_ai_generated: true,
            generated_from: prompt,
            generated_via: 'proxy'
        };

        return res.json(parsed);
    } catch (err) {
        logger.error('AI Scaffold Error', { error: err.message, stack: err.stack });
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/ai/assist', async (req, res) => {
    const { provider, model, messages, schema, currentData } = req.body;

    if (!schema || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages and schema are required.' });
    }

    const normalizedMessages = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
    }));

    const systemInstruction = `You are an expert Vant Flow AI Assistant.
You are helping a user fill a live Vant Flow form.

Schema JSON Structure: ${JSON.stringify(schema)}
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
        const result = await callModel({
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

// --- Data Persistence Endpoints ---

// Forms
app.get('/api/forms', async (req, res) => {
    try {
        const forms = await db.all('SELECT * FROM forms ORDER BY lastModified DESC');
        logger.info(`Fetched ${forms.length} forms`);
        res.json(forms.map(f => ({ ...f, schema: JSON.parse(f.schema) })));
    } catch (err) {
        logger.error('Failed to fetch forms', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/forms', async (req, res) => {
    const { id, schema, lastModified } = req.body;
    try {
        await db.run(
            'INSERT OR REPLACE INTO forms (id, schema, lastModified) VALUES (?, ?, ?)',
            [id, JSON.stringify(schema), lastModified || new Date().toISOString()]
        );
        logger.info(`Saved form: ${id} (${schema.name})`);
        res.json({ success: true, id });
    } catch (err) {
        logger.error(`Failed to save form: ${id}`, err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/forms/:id', async (req, res) => {
    try {
        await db.run('DELETE FROM forms WHERE id = ?', req.params.id);
        await db.run('DELETE FROM submissions WHERE formId = ?', req.params.id);
        await db.run('DELETE FROM chat_history WHERE formId = ?', req.params.id);
        logger.info(`Deleted form: ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error(`Failed to delete form: ${req.params.id}`, err);
        res.status(500).json({ error: err.message });
    }
});

// Submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM submissions ORDER BY timestamp DESC');
        logger.info(`Fetched ${rows.length} submissions`);
        res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data), metadata: JSON.parse(r.metadata || '{}') })));
    } catch (err) {
        logger.error('Failed to fetch submissions', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/submissions', async (req, res) => {
    const { id, formId, formName, timestamp, data, metadata } = req.body;
    try {
        await db.run(
            'INSERT INTO submissions (id, formId, formName, timestamp, data, metadata) VALUES (?, ?, ?, ?, ?, ?)',
            [id, formId, formName, timestamp, JSON.stringify(data), JSON.stringify(metadata || {})]
        );
        logger.info(`Saved submission: ${id} for form ${formId}`);
        res.json({ success: true, id });
    } catch (err) {
        logger.error(`Failed to save submission: ${id}`, err);
        res.status(500).json({ error: err.message });
    }
});

// Chat History
app.get('/api/chat/:formId', async (req, res) => {
    try {
        const rows = await db.all('SELECT role, content, timestamp FROM chat_history WHERE formId = ? ORDER BY id ASC', req.params.formId);
        logger.info(`Fetched ${rows.length} chat history items for form ${req.params.formId}`);
        res.json(rows);
    } catch (err) {
        logger.error(`Failed to fetch chat history for form ${req.params.formId}`, err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/chat/:formId', async (req, res) => {
    const { role, content, timestamp } = req.body;
    try {
        await db.run(
            'INSERT INTO chat_history (formId, role, content, timestamp) VALUES (?, ?, ?, ?)',
            [req.params.formId, role, content, timestamp || new Date().toISOString()]
        );
        logger.info(`Saved chat message (${role}) for form ${req.params.formId}`);
        res.json({ success: true });
    } catch (err) {
        logger.error(`Failed to save chat message for form ${req.params.formId}`, err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/chat/:formId', async (req, res) => {
    try {
        await db.run('DELETE FROM chat_history WHERE formId = ?', req.params.formId);
        logger.info(`Cleared chat history for form ${req.params.formId}`);
        res.json({ success: true });
    } catch (err) {
        logger.error(`Failed to clear chat history for form ${req.params.formId}`, err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    logger.info(`Vant Flow AI Proxy (Backend Adapter) running at http://localhost:${PORT}`);
});
