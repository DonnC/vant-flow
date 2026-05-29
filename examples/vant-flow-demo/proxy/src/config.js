import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const proxyRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(proxyRoot, '../../../');
const envPath = path.resolve(repoRoot, '.env');

dotenv.config({ path: envPath });

export const paths = {
    proxyRoot,
    repoRoot,
    envPath,
    logDir: path.resolve(proxyRoot, 'logs'),
    proxyLogFile: path.resolve(proxyRoot, 'logs/proxy.log'),
    uploadDir: path.resolve(proxyRoot, 'uploads'),
    dbPath: path.resolve(proxyRoot, 'vant_flow.db')
};

export const config = {
    port: Number(process.env.PORT || 3002),
    mcpServerUrl: process.env.MCP_SERVER_URL?.trim() || 'http://localhost:3001/sse',
    defaultProvider: process.env.AI_PROVIDER || 'openai',
    defaultOpenAiModel: process.env.OPEN_AI_MODEL || 'gpt-4o-mini-2024-07-18'
};

export function getOpenAiKey() {
    return process.env.OPENAI_API_KEY?.trim() || process.env.OPEN_AI_KEY?.trim() || null;
}

export function getGeminiKey() {
    return process.env.GEMINI_API_KEY?.trim() || null;
}

export function normalizeProvider(provider) {
    return provider || config.defaultProvider;
}

export function getDefaultModel(provider, requestedModel) {
    if (provider === 'openai') {
        return requestedModel || config.defaultOpenAiModel;
    }
    return requestedModel || 'gemini-1.5-flash';
}
