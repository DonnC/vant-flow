import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDefaultModel, getGeminiKey, getOpenAiKey, normalizeProvider } from './config.js';
import { mapMessagePartsToGemini } from './utils.js';

export function createModelClient({ logger }) {
    async function callModel({ provider: requestedProvider, model: requestedModel, messages, config = {} }) {
        const provider = normalizeProvider(requestedProvider);
        const key = provider === 'openai' ? getOpenAiKey() : getGeminiKey();

        if (!key) {
            throw new Error(`API Key for ${provider} is missing in .env`);
        }

        logger.info('Incoming completion request', { provider, messagesCount: messages.length });

        if (provider === 'openai') {
            const client = new OpenAI({ apiKey: key });
            const completion = await client.chat.completions.create({
                model: getDefaultModel(provider, requestedModel),
                messages,
                ...config
            });
            const content = completion.choices[0].message.content;
            logger.info('OpenAI completion successful', { responseSnippet: content ? content.substring(0, 100) + '...' : 'EMPTY' });
            return {
                provider,
                content: content || '',
                raw: completion
            };
        }

        const genAI = new GoogleGenerativeAI(key);
        const geminiModel = genAI.getGenerativeModel({ model: getDefaultModel(provider, requestedModel) });
        const hasStructuredParts = messages.some(message => Array.isArray(message.content));
        const prompt = hasStructuredParts
            ? messages.flatMap(message => mapMessagePartsToGemini(message.role, message.content))
            : messages.map(m => `${String(m.role || 'user').toUpperCase()}:\n${m.content}`).join('\n\n');
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        logger.info('Gemini completion successful', { responseSnippet: content ? content.substring(0, 100) + '...' : 'EMPTY' });
        return {
            provider,
            content: content || '',
            raw: {
                choices: [{ message: { content } }]
            }
        };
    }

    return { callModel };
}
