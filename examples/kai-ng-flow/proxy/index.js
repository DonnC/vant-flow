import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../../.env');
console.log(`[AI Proxy] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const app = express();
app.use(cors());
app.use(express.json());

// Startup Check
const startupOpenAiKey = process.env.OPENAI_API_KEY?.trim() || process.env.OPEN_AI_KEY?.trim();
const startupGeminiKey = process.env.GEMINI_API_KEY?.trim();
console.log(`[AI Proxy] Startup Key Check:`);
console.log(` - OpenAI: ${startupOpenAiKey ? 'OK (ends with ' + startupOpenAiKey.slice(-4) + ')' : 'MISSING'}`);
console.log(` - Gemini: ${startupGeminiKey ? 'OK (ends with ' + startupGeminiKey.slice(-4) + ')' : 'MISSING'}`);

const PORT = 3002;

app.post('/ai/completion', async (req, res) => {
    // Provider selection: Client request > Environment Variable > Default (openai)
    const { provider: requestedProvider, model: requestedModel, messages, config } = req.body;
    const provider = requestedProvider || process.env.AI_PROVIDER || 'openai';

    // Key Resolution (Prioritize standard OPENAI_API_KEY)
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

    const keyLength = key ? key.length : 0;
    const maskedKey = key ? `${key.substring(0, 7)}...${key.substring(keyLength - 4)}` : 'MISSING';

    console.log(`[AI Proxy] Request for ${provider} (Source: ${keySource})`);
    console.log(`[AI Proxy] Key Info: length=${key ? key.length : 0}, masked=${maskedKey}`);
    console.log(`[AI Proxy] Messages count: ${messages?.length}`);

    if (!key) {
        return res.status(401).json({ error: `API Key for ${provider} is missing in .env` });
    }

    try {
        if (provider === 'openai') {
            const client = new OpenAI({ apiKey: key });
            const completion = await client.chat.completions.create({
                model: requestedModel || process.env.OPEN_AI_MODEL || 'gpt-4o-mini-2024-07-18',
                messages: messages,
                ...config
            });
            return res.json(completion);
        } else if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(key);
            const geminiModel = genAI.getGenerativeModel({ model: requestedModel || 'gemini-1.5-flash' });

            // Convert messages to Gemini format (simplified)
            const prompt = messages[messages.length - 1].content;
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            return res.json({
                choices: [{
                    message: {
                        content: response.text()
                    }
                }]
            });
        } else {
            res.status(400).json({ error: 'Unsupported provider' });
        }
    } catch (err) {
        console.error('[AI Proxy] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Vant Flow AI Proxy running at http://localhost:${PORT}`);
});
