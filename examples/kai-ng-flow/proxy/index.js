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
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Logging System ---
const LOG_DIR = path.resolve(__dirname, 'logs');
const PROXY_LOG_FILE = path.join(LOG_DIR, 'proxy.log');
const UPLOAD_DIR = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
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

    fs.appendFile(PROXY_LOG_FILE, logString, (err) => {
        if (err) {
            console.error('[ERROR] Failed to write proxy log', err);
        }
    });
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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

function compactAssistSchema(schema) {
    if (!schema || typeof schema !== 'object') return {};

    const compactField = (field) => ({
        fieldname: field?.fieldname,
        fieldtype: field?.fieldtype,
        label: field?.label,
        mandatory: !!(field?.mandatory || field?.reqd),
        read_only: !!field?.read_only,
        hidden: !!field?.hidden,
        depends_on: field?.depends_on,
        mandatory_depends_on: field?.mandatory_depends_on,
        options: typeof field?.options === 'string' ? field.options.slice(0, 160) : field?.options,
        data_group: field?.data_group,
        link_config: field?.link_config ? {
            data_source: field.link_config.data_source,
            mapping: field.link_config.mapping,
            filters: field.link_config.filters
        } : undefined,
        table_fields: Array.isArray(field?.table_fields)
            ? field.table_fields.map((column) => ({
                fieldname: column?.fieldname,
                fieldtype: column?.fieldtype,
                label: column?.label,
                mandatory: !!column?.mandatory
            }))
            : undefined
    });

    const compactSection = (section) => ({
        id: section?.id,
        label: section?.label,
        description: section?.description,
        depends_on: section?.depends_on,
        fields: (section?.columns || []).flatMap(column =>
            (column?.fields || []).map(compactField)
        )
    });

    return {
        name: schema.name,
        description: schema.description,
        is_stepper: !!schema.is_stepper,
        actions: schema.actions,
        metadata: schema.metadata,
        has_client_script: !!schema.client_script,
        steps: (schema.steps || []).map(step => ({
            id: step.id,
            title: step.title,
            description: step.description,
            sections: (step.sections || []).map(compactSection)
        })),
        sections: (schema.sections || []).map(compactSection)
    };
}

const DEMO_CUSTOMERS = [
    {
        record: {
            id: 'CUST-0001',
            profile: {
                display_name: 'ZimFresh HQ',
                meta: { search_hint: 'Corporate • Borrowdale • Premium SLA' },
                city: 'Harare',
                contact_person: 'Ruvimbo Mhlanga'
            }
        },
        status: 'Active'
    },
    {
        record: {
            id: 'CUST-0002',
            profile: {
                display_name: 'Borrowdale Medical Centre',
                meta: { search_hint: 'Healthcare • Borrowdale • 24/7 Operations' },
                city: 'Harare',
                contact_person: 'Dr. Tatenda Ncube'
            }
        },
        status: 'Active'
    },
    {
        record: {
            id: 'CUST-0003',
            profile: {
                display_name: 'Eastgate Mall Management',
                meta: { search_hint: 'Retail • CBD • Multi-site connectivity' },
                city: 'Harare',
                contact_person: 'Nigel Chari'
            }
        },
        status: 'Active'
    },
    {
        record: {
            id: 'CUST-0004',
            profile: {
                display_name: 'Mutare Agro Exports',
                meta: { search_hint: 'Manufacturing • Mutare • Warehouse link' },
                city: 'Mutare',
                contact_person: 'Chido Mutasa'
            }
        },
        status: 'Active'
    },
    {
        record: {
            id: 'CUST-0005',
            profile: {
                display_name: 'Old Town Hotel',
                meta: { search_hint: 'Hospitality • Bulawayo • Legacy contract' },
                city: 'Bulawayo',
                contact_person: 'Farai Ndlovu'
            }
        },
        status: 'Inactive'
    }
];

const DEMO_EQUIPMENT = [
    {
        asset: {
            id: 'ASSET-1001',
            serial_number: 'FBR-0092',
            model: { display_name: 'Huawei OptiXstar EG8145X6' }
        },
        service_type: 'Fiber Repair'
    },
    {
        asset: {
            id: 'ASSET-1002',
            serial_number: 'RTR-1188',
            model: { display_name: 'MikroTik CCR2004 Core Router' }
        },
        service_type: 'Router Replacement'
    },
    {
        asset: {
            id: 'ASSET-1003',
            serial_number: 'SIG-4421',
            model: { display_name: 'Ubiquiti AirFiber Signal Bridge' }
        },
        service_type: 'Signal Investigation'
    },
    {
        asset: {
            id: 'ASSET-1004',
            serial_number: 'FBR-0197',
            model: { display_name: 'ZTE ZXHN F670L' }
        },
        service_type: 'Fiber Repair'
    },
    {
        asset: {
            id: 'ASSET-1005',
            serial_number: 'PM-7710',
            model: { display_name: 'Cisco Catalyst 9300 Edge Switch' }
        },
        service_type: 'Preventive Maintenance'
    }
];

function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

function matchesQuery(fields, query) {
    const needle = normalizeText(query);
    if (!needle) return true;
    return fields.some(field => normalizeText(field).includes(needle));
}

function applyLimit(items, rawLimit, fallback = 20) {
    const parsed = Number(rawLimit);
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    return items.slice(0, limit);
}

function extractDemoSearchParams(req) {
    if (req.method === 'GET') {
        return {
            query: req.query.q || '',
            limit: req.query.limit || 20,
            filters: Object.entries(req.query)
                .filter(([key]) => key.startsWith('filters.'))
                .reduce((acc, [key, value]) => {
                    acc[key.replace(/^filters\./, '')] = value;
                    return acc;
                }, {})
        };
    }

    return {
        query: req.body?.q || '',
        limit: req.body?.limit || 20,
        filters: req.body?.filters || {}
    };
}

function sanitizeFilenamePart(value) {
    return String(value || 'file')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'file';
}

function guessExtensionFromMime(mimeType) {
    const mime = String(mimeType || '').toLowerCase();
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'application/pdf') return 'pdf';
    if (mime === 'image/svg+xml') return 'svg';
    return 'bin';
}

function parseDataUrl(dataUrl) {
    const match = String(dataUrl || '').match(/^data:(.*?);base64,(.*)$/);
    if (!match) return null;
    return {
        mimeType: match[1] || 'application/octet-stream',
        base64: match[2] || ''
    };
}

async function findStoredUploadByFileId(fileId) {
    const entries = await fs.promises.readdir(UPLOAD_DIR);
    const filename = entries.find(entry => entry.startsWith(`${fileId}_`));
    if (!filename) return null;

    const filePath = path.join(UPLOAD_DIR, filename);
    const stat = await fs.promises.stat(filePath);
    return {
        filename,
        filePath,
        stat
    };
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

// --- Demo Link Field Endpoints ---
app.get('/api/demo/customers/search', (req, res) => {
    const { query, limit, filters } = extractDemoSearchParams(req);
    const statusFilter = normalizeText(filters.status);

    const results = DEMO_CUSTOMERS
        .filter(customer => !statusFilter || normalizeText(customer.status) === statusFilter)
        .filter(customer => matchesQuery([
            customer.record.id,
            customer.record.profile.display_name,
            customer.record.profile.meta.search_hint,
            customer.record.profile.city,
            customer.record.profile.contact_person
        ], query));

    logger.info('Demo customer search', { query, filters, resultCount: results.length });
    res.json({
        payload: {
            data: {
                items: applyLimit(results, limit, 15)
            }
        }
    });
});

app.post('/api/demo/equipment/search', (req, res) => {
    const { query, limit, filters } = extractDemoSearchParams(req);
    const serviceTypeFilter = normalizeText(filters.service_type);

    const results = DEMO_EQUIPMENT
        .filter(item => !serviceTypeFilter || normalizeText(item.service_type) === serviceTypeFilter)
        .filter(item => matchesQuery([
            item.asset.id,
            item.asset.serial_number,
            item.asset.model.display_name,
            item.service_type
        ], query));

    logger.info('Demo equipment search', { query, filters, resultCount: results.length });
    res.json({
        results: applyLimit(results, limit)
    });
});

app.post('/api/demo/storage/upload', async (req, res) => {
    try {
        const {
            fieldtype = 'Attach',
            name = 'upload.bin',
            type,
            size,
            dataUrl,
            metadata = {}
        } = req.body || {};

        const parsed = parseDataUrl(dataUrl);
        if (!parsed?.base64) {
            return res.status(400).json({ error: 'A base64 dataUrl is required.' });
        }

        const fileId = `file_${crypto.randomUUID()}`;
        const safeBaseName = sanitizeFilenamePart(path.parse(name).name);
        const fileExtension = path.extname(name).replace('.', '') || guessExtensionFromMime(type || parsed.mimeType);
        const storedFilename = `${fileId}_${safeBaseName}.${fileExtension}`;
        const storedPath = path.join(UPLOAD_DIR, storedFilename);
        const binary = Buffer.from(parsed.base64, 'base64');

        await fs.promises.writeFile(storedPath, binary);

        const publicUrl = `http://localhost:${PORT}/api/demo/storage/files/${fileId}`;
        const downloadUrl = `http://localhost:${PORT}/api/demo/storage/files/${fileId}/download`;
        const response = {
            fileId,
            provider: 'mock-cloud-storage',
            bucket: 'vant-flow-demo',
            name,
            type: type || parsed.mimeType,
            size: Number(size) || binary.length,
            publicUrl,
            previewUrl: publicUrl,
            downloadUrl,
            metadata: {
                uploadedAt: new Date().toISOString(),
                fieldtype,
                originalName: name,
                storedFilename,
                ...metadata
            }
        };

        logger.info('Demo storage upload saved', {
            fileId,
            fieldtype,
            name,
            storedFilename,
            size: response.size
        });

        return res.json(response);
    } catch (err) {
        logger.error('Demo storage upload failed', { error: err.message, stack: err.stack });
        return res.status(500).json({ error: 'Failed to store uploaded media.' });
    }
});

app.get('/api/demo/storage/files/:fileId', async (req, res) => {
    try {
        const match = await findStoredUploadByFileId(req.params.fileId);
        if (!match) {
            return res.status(404).json({ error: 'Stored file not found.' });
        }

        return res.sendFile(match.filePath);
    } catch (err) {
        logger.error('Demo storage preview fetch failed', { error: err.message, stack: err.stack, fileId: req.params.fileId });
        return res.status(500).json({ error: 'Failed to fetch stored file.' });
    }
});

app.get('/api/demo/storage/files/:fileId/download', async (req, res) => {
    try {
        const match = await findStoredUploadByFileId(req.params.fileId);
        if (!match) {
            return res.status(404).json({ error: 'Stored file not found.' });
        }

        return res.download(match.filePath, match.filename.replace(/^[^_]+_/, ''));
    } catch (err) {
        logger.error('Demo storage download failed', { error: err.message, stack: err.stack, fileId: req.params.fileId });
        return res.status(500).json({ error: 'Failed to download stored file.' });
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
