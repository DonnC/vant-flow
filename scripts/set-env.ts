import { writeFile, mkdirSync, existsSync } from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const targetPath = './examples/kai-ng-flow/src/environments/environment.ai.ts';

// Create directory if it doesn't exist
const dir = './examples/kai-ng-flow/src/environments';
if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
}

const envConfigFile = `export const aiConfig = {
  geminiApiKey: '${process.env['GEMINI_API_KEY'] || ''}',
  openAiKey: '${process.env['OPEN_AI_KEY'] || ''}',
  openAiModel: '${process.env['OPEN_AI_MODEL'] || 'gpt-4o-mini-2024-07-18'}',
  mcpServerUrl: '${process.env['MCP_SERVER_URL'] || 'http://localhost:3001/sse'}'
};
`;

console.log('Generating environment file at ' + targetPath);

writeFile(targetPath, envConfigFile, (err) => {
    if (err) {
        console.error(err);
        throw err;
    }
    console.log(`Vant Flow AI environment file generated successfully!`);
});
