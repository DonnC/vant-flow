import { createProxyApp } from './src/create-app.js';

async function main() {
    const { app, logger, config } = await createProxyApp();
    app.listen(config.port, () => {
        logger.info(`Vant Flow AI Proxy (Backend Adapter) running at http://localhost:${config.port}`);
    });
}

main().catch((err) => {
    console.error('[FATAL] Failed to start example proxy', err);
    process.exit(1);
});
