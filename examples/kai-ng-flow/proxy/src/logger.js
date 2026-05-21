import fs from 'fs';

export function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export function createLogger(logFile) {
    ensureDir(logFile.replace(/[\\/][^\\/]+$/, ''));

    function logToDisk(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...(data ? { data } : {})
        };
        const logString = JSON.stringify(logEntry) + '\n';
        const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[32m';

        console.log(`${color}[${level}] ${timestamp}: ${message}\x1b[0m`);
        if (data && level === 'ERROR') console.error(data);
        if (data && level === 'WARN') console.warn(data);

        fs.appendFile(logFile, logString, (err) => {
            if (err) {
                console.error('[ERROR] Failed to write proxy log', err);
            }
        });
    }

    return {
        info: (msg, data) => logToDisk('INFO', msg, data),
        warn: (msg, data) => logToDisk('WARN', msg, data),
        error: (msg, data) => logToDisk('ERROR', msg, data)
    };
}
