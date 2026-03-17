const fs = require('fs');
const path = require('path');
require('dotenv').config();

const targetPath = path.join(__dirname, '../examples/kai-ng-flow/src/environments/environment.ai.ts');

const envConfigFile = `export const aiConfig = {
  geminiApiKey: '${process.env.GEMINI_API_KEY || ''}',
  openAiKey: '${process.env.OPEN_AI_KEY || ''}',
  openAiModel: '${process.env.OPEN_AI_MODEL || 'gpt-4o-mini-2024-07-18'}',
  mcpServerUrl: '${process.env.MCP_SERVER_URL || 'http://localhost:3001/sse'}'
};
`;

console.log('Generating environment file at ' + targetPath);

const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Vant Flow AI environment file generated successfully!`);
