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

// --- AI Completion Endpoint ---
app.post('/ai/completion', async (req, res) => {
    const { provider: requestedProvider, model: requestedModel, messages, config } = req.body;
    const provider = requestedProvider || process.env.AI_PROVIDER || 'openai';

    let key, keySource;
    if (provider === 'openai') {
        if (process.env.OPENAI_API_KEY) {
            key = process.env.OPENAI_API_KEY.trim();
            keySource = 'OPENAI_API_KEY';
        } else if (process.env.OPEN_AI_KEY) {
            key = process.env.OPEN_AI_KEY.trim();
            keySource = 'OPEN_AI_KEY';
        }
    } else {
        key = process.env.GEMINI_API_KEY?.trim();
        keySource = 'GEMINI_API_KEY';
    }

    if (!key) {
        return res.status(401).json({ error: `API Key for ${provider} is missing in .env` });
    }

    try {
        logger.info(`Incoming completion request`, { provider, messagesCount: messages.length });

        if (provider === 'openai') {
            const client = new OpenAI({ apiKey: key });
            const completion = await client.chat.completions.create({
                model: requestedModel || process.env.OPEN_AI_MODEL || 'gpt-4o-mini-2024-07-18',
                messages: messages,
                ...config
            });
            const content = completion.choices[0].message.content;
            logger.info(`OpenAI completion successful`, { responseSnippet: content ? content.substring(0, 100) + '...' : 'EMPTY' });
            return res.json(completion);
        } else if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(key);
            const geminiModel = genAI.getGenerativeModel({ model: requestedModel || 'gemini-1.5-flash' });
            const prompt = messages[messages.length - 1].content;
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const content = response.text();
            logger.info(`Gemini completion successful`, { responseSnippet: content ? content.substring(0, 100) + '...' : 'EMPTY' });
            return res.json({
                choices: [{
                    message: {
                        content: content
                    }
                }]
            });
        }
    } catch (err) {
        logger.error('AI Proxy Error', { error: err.message, stack: err.stack });
        res.status(500).json({ error: err.message });
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
