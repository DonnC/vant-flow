import express from 'express';
import cors from 'cors';
import { config, getGeminiKey, getOpenAiKey, paths } from './config.js';
import { initDb } from './db.js';
import { createLogger } from './logger.js';
import { createMcpService } from './mcp-client.js';
import { createModelClient } from './model-client.js';
import { createAiRouter } from './routes/ai-routes.js';
import { createDemoRouter } from './routes/demo-routes.js';
import { createPersistenceRouter } from './routes/persistence-routes.js';
import { ensureStorageDirs, findStoredUploadByFileId, loadStoredReferenceFile } from './storage.js';

export async function createProxyApp() {
    ensureStorageDirs(paths);

    const logger = createLogger(paths.proxyLogFile);
    const db = await initDb(paths.dbPath, logger);

    logger.info('Startup Key Check:');
    const startupOpenAiKey = getOpenAiKey();
    const startupGeminiKey = getGeminiKey();
    logger.info(` - OpenAI: ${startupOpenAiKey ? 'OK (ends with ' + startupOpenAiKey.slice(-4) + ')' : 'MISSING'}`);
    logger.info(` - Gemini: ${startupGeminiKey ? 'OK (ends with ' + startupGeminiKey.slice(-4) + ')' : 'MISSING'}`);
    logger.info(` - MCP Server URL: ${config.mcpServerUrl}`);

    const storage = {
        findStoredUploadByFileId: (fileId) => findStoredUploadByFileId(paths.uploadDir, fileId),
        loadStoredReferenceFile: (referenceFile) => loadStoredReferenceFile(paths.uploadDir, referenceFile)
    };

    const mcpService = createMcpService({
        mcpServerUrl: config.mcpServerUrl,
        logger
    });

    const modelClient = createModelClient({ logger });

    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ extended: true, limit: '100mb' }));

    app.use(createAiRouter({ logger, modelClient, mcpService, storage }));
    app.use(createDemoRouter({ logger, storage, uploadDir: paths.uploadDir, port: config.port }));
    app.use(createPersistenceRouter({ db, logger }));

    return {
        app,
        logger,
        db,
        config,
        paths
    };
}
