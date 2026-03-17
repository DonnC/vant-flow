import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3002;

app.post('/ai/completion', async (req, res) => {
    const { provider, model, messages, config } = req.body;
    console.log(`[AI Proxy] Request for ${provider} (${model})`);

    try {
        if (provider === 'openai') {
            const client = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
            const completion = await client.chat.completions.create({
                model: model || process.env.OPEN_AI_MODEL || 'gpt-4o-mini-2024-07-18',
                messages: messages,
                ...config
            });
            return res.json(completion);
        } else if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

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
