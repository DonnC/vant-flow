import fs from 'fs';
import path from 'path';

export function ensureStorageDirs(paths) {
    if (!fs.existsSync(paths.logDir)) {
        fs.mkdirSync(paths.logDir, { recursive: true });
    }
    if (!fs.existsSync(paths.uploadDir)) {
        fs.mkdirSync(paths.uploadDir, { recursive: true });
    }
}

export async function findStoredUploadByFileId(uploadDir, fileId) {
    const entries = await fs.promises.readdir(uploadDir);
    const filename = entries.find(entry => entry.startsWith(`${fileId}_`));
    if (!filename) return null;

    const filePath = path.join(uploadDir, filename);
    const stat = await fs.promises.stat(filePath);
    return {
        filename,
        filePath,
        stat
    };
}

export async function loadStoredReferenceFile(uploadDir, referenceFile) {
    if (!referenceFile?.fileId) return null;

    const match = await findStoredUploadByFileId(uploadDir, referenceFile.fileId);
    if (!match) return null;

    const binary = await fs.promises.readFile(match.filePath);
    const mimeType = referenceFile.type || 'application/octet-stream';
    const base64 = binary.toString('base64');
    return {
        ...referenceFile,
        mimeType,
        base64,
        dataUrl: `data:${mimeType};base64,${base64}`
    };
}
