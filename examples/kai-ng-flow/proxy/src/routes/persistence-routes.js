import express from 'express';

export function createPersistenceRouter({ db, logger }) {
    const router = express.Router();

    router.get('/api/forms', async (req, res) => {
        try {
            const forms = await db.all('SELECT * FROM forms ORDER BY lastModified DESC');
            logger.info(`Fetched ${forms.length} forms`);
            res.json(forms.map(f => ({ ...f, schema: JSON.parse(f.schema) })));
        } catch (err) {
            logger.error('Failed to fetch forms', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/api/forms', async (req, res) => {
        const { id, schema, lastModified } = req.body;
        try {
            await db.run(
                'INSERT OR REPLACE INTO forms (id, schema, lastModified) VALUES (?, ?, ?)',
                [id, JSON.stringify(schema), lastModified || new Date().toISOString()]
            );
            logger.info(`Saved form: ${id} (${schema.name})`);
            res.json({ success: true, id });
        } catch (err) {
            logger.error(`Failed to save form: ${id}`, err);
            res.status(500).json({ error: err.message });
        }
    });

    router.delete('/api/forms/:id', async (req, res) => {
        try {
            await db.run('DELETE FROM forms WHERE id = ?', req.params.id);
            await db.run('DELETE FROM submissions WHERE formId = ?', req.params.id);
            await db.run('DELETE FROM chat_history WHERE formId = ?', req.params.id);
            logger.info(`Deleted form: ${req.params.id}`);
            res.json({ success: true });
        } catch (err) {
            logger.error(`Failed to delete form: ${req.params.id}`, err);
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/api/submissions', async (req, res) => {
        try {
            const rows = await db.all('SELECT * FROM submissions ORDER BY timestamp DESC');
            logger.info(`Fetched ${rows.length} submissions`);
            res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data), metadata: JSON.parse(r.metadata || '{}') })));
        } catch (err) {
            logger.error('Failed to fetch submissions', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/api/submissions', async (req, res) => {
        const { id, formId, formName, timestamp, data, metadata } = req.body;
        try {
            await db.run(
                'INSERT INTO submissions (id, formId, formName, timestamp, data, metadata) VALUES (?, ?, ?, ?, ?, ?)',
                [id, formId, formName, timestamp, JSON.stringify(data), JSON.stringify(metadata || {})]
            );
            logger.info(`Saved submission: ${id} for form ${formId}`);
            res.json({ success: true, id });
        } catch (err) {
            logger.error(`Failed to save submission: ${id}`, err);
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/api/chat/:formId', async (req, res) => {
        try {
            const rows = await db.all('SELECT role, content, timestamp FROM chat_history WHERE formId = ? ORDER BY id ASC', req.params.formId);
            logger.info(`Fetched ${rows.length} chat history items for form ${req.params.formId}`);
            res.json(rows);
        } catch (err) {
            logger.error(`Failed to fetch chat history for form ${req.params.formId}`, err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/api/chat/:formId', async (req, res) => {
        const { role, content, timestamp } = req.body;
        try {
            await db.run(
                'INSERT INTO chat_history (formId, role, content, timestamp) VALUES (?, ?, ?, ?)',
                [req.params.formId, role, content, timestamp || new Date().toISOString()]
            );
            logger.info(`Saved chat message (${role}) for form ${req.params.formId}`);
            res.json({ success: true });
        } catch (err) {
            logger.error(`Failed to save chat message for form ${req.params.formId}`, err);
            res.status(500).json({ error: err.message });
        }
    });

    router.delete('/api/chat/:formId', async (req, res) => {
        try {
            await db.run('DELETE FROM chat_history WHERE formId = ?', req.params.formId);
            logger.info(`Cleared chat history for form ${req.params.formId}`);
            res.json({ success: true });
        } catch (err) {
            logger.error(`Failed to clear chat history for form ${req.params.formId}`, err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
}
