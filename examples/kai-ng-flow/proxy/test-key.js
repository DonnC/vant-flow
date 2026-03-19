import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const key = process.env.OPEN_AI_KEY?.trim();
    console.log('Testing key length:', key?.length);
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [{ role: "user", content: "Say 'Key is working!'" }],
    });
    console.log('SUCCESS:', completion.choices[0].message.content);
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}
test();
