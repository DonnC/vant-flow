import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DEMO_CUSTOMERS, DEMO_EQUIPMENT } from '../demo-data.js';
import {
    applyLimit,
    extractDemoSearchParams,
    guessExtensionFromMime,
    matchesQuery,
    normalizeText,
    parseDataUrl,
    sanitizeFilenamePart
} from '../utils.js';

export function createDemoRouter({ logger, storage, uploadDir, port }) {
    const router = express.Router();

    router.get('/api/demo/customers/search', (req, res) => {
        const { query, limit, filters } = extractDemoSearchParams(req);
        const statusFilter = normalizeText(filters.status);

        const results = DEMO_CUSTOMERS
            .filter(customer => !statusFilter || normalizeText(customer.status) === statusFilter)
            .filter(customer => matchesQuery([
                customer.record.id,
                customer.record.profile.display_name,
                customer.record.profile.meta.search_hint,
                customer.record.profile.city,
                customer.record.profile.contact_person
            ], query));

        logger.info('Demo customer search', { query, filters, resultCount: results.length });
        res.json({
            payload: {
                data: {
                    items: applyLimit(results, limit, 15)
                }
            }
        });
    });

    router.post('/api/demo/equipment/search', (req, res) => {
        const { query, limit, filters } = extractDemoSearchParams(req);
        const serviceTypeFilter = normalizeText(filters.service_type);

        const results = DEMO_EQUIPMENT
            .filter(item => !serviceTypeFilter || normalizeText(item.service_type) === serviceTypeFilter)
            .filter(item => matchesQuery([
                item.asset.id,
                item.asset.serial_number,
                item.asset.model.display_name,
                item.service_type
            ], query));

        logger.info('Demo equipment search', { query, filters, resultCount: results.length });
        res.json({
            results: applyLimit(results, limit)
        });
    });

    router.post('/api/demo/storage/upload', async (req, res) => {
        try {
            const {
                fieldtype = 'Attach',
                name = 'upload.bin',
                type,
                size,
                dataUrl,
                metadata = {}
            } = req.body || {};

            const parsed = parseDataUrl(dataUrl);
            if (!parsed?.base64) {
                return res.status(400).json({ error: 'A base64 dataUrl is required.' });
            }

            const fileId = `file_${crypto.randomUUID()}`;
            const safeBaseName = sanitizeFilenamePart(path.parse(name).name);
            const fileExtension = path.extname(name).replace('.', '') || guessExtensionFromMime(type || parsed.mimeType);
            const storedFilename = `${fileId}_${safeBaseName}.${fileExtension}`;
            const storedPath = path.join(uploadDir, storedFilename);
            const binary = Buffer.from(parsed.base64, 'base64');

            await fs.promises.writeFile(storedPath, binary);

            const publicUrl = `http://localhost:${port}/api/demo/storage/files/${fileId}`;
            const downloadUrl = `http://localhost:${port}/api/demo/storage/files/${fileId}/download`;
            const response = {
                fileId,
                provider: 'mock-cloud-storage',
                bucket: 'vant-flow-demo',
                name,
                type: type || parsed.mimeType,
                size: Number(size) || binary.length,
                publicUrl,
                previewUrl: publicUrl,
                downloadUrl,
                metadata: {
                    uploadedAt: new Date().toISOString(),
                    fieldtype,
                    originalName: name,
                    storedFilename,
                    ...metadata
                }
            };

            logger.info('Demo storage upload saved', {
                fileId,
                fieldtype,
                name,
                storedFilename,
                size: response.size
            });

            return res.json(response);
        } catch (err) {
            logger.error('Demo storage upload failed', { error: err.message, stack: err.stack });
            return res.status(500).json({ error: 'Failed to store uploaded media.' });
        }
    });

    router.get('/api/demo/storage/files/:fileId', async (req, res) => {
        try {
            const match = await storage.findStoredUploadByFileId(req.params.fileId);
            if (!match) {
                return res.status(404).json({ error: 'Stored file not found.' });
            }

            return res.sendFile(match.filePath);
        } catch (err) {
            logger.error('Demo storage preview fetch failed', { error: err.message, stack: err.stack, fileId: req.params.fileId });
            return res.status(500).json({ error: 'Failed to fetch stored file.' });
        }
    });

    router.get('/api/demo/storage/files/:fileId/download', async (req, res) => {
        try {
            const match = await storage.findStoredUploadByFileId(req.params.fileId);
            if (!match) {
                return res.status(404).json({ error: 'Stored file not found.' });
            }

            return res.download(match.filePath, match.filename.replace(/^[^_]+_/, ''));
        } catch (err) {
            logger.error('Demo storage download failed', { error: err.message, stack: err.stack, fileId: req.params.fileId });
            return res.status(500).json({ error: 'Failed to download stored file.' });
        }
    });

    return router;
}
