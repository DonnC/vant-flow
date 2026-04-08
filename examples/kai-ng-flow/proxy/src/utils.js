export function extractJsonObject(content) {
    if (!content) return null;
    const fenced = content.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) return fenced[1];
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    return content.slice(firstBrace, lastBrace + 1);
}

export function parseJsonSafely(content) {
    const candidate = extractJsonObject(content) || content;
    try {
        return JSON.parse(candidate.trim());
    } catch {
        return null;
    }
}

export function truncateText(value, maxLength = 1600) {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
}

export function matchesQuery(fields, query) {
    const needle = normalizeText(query);
    if (!needle) return true;
    return fields.some(field => normalizeText(field).includes(needle));
}

export function applyLimit(items, rawLimit, fallback = 20) {
    const parsed = Number(rawLimit);
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    return items.slice(0, limit);
}

export function extractDemoSearchParams(req) {
    if (req.method === 'GET') {
        return {
            query: req.query.q || '',
            limit: req.query.limit || 20,
            filters: Object.entries(req.query)
                .filter(([key]) => key.startsWith('filters.'))
                .reduce((acc, [key, value]) => {
                    acc[key.replace(/^filters\./, '')] = value;
                    return acc;
                }, {})
        };
    }

    return {
        query: req.body?.q || '',
        limit: req.body?.limit || 20,
        filters: req.body?.filters || {}
    };
}

export function sanitizeFilenamePart(value) {
    return String(value || 'file')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'file';
}

export function guessExtensionFromMime(mimeType) {
    const mime = String(mimeType || '').toLowerCase();
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'application/pdf') return 'pdf';
    if (mime === 'image/svg+xml') return 'svg';
    return 'bin';
}

export function parseDataUrl(dataUrl) {
    const match = String(dataUrl || '').match(/^data:(.*?);base64,(.*)$/);
    if (!match) return null;
    return {
        mimeType: match[1] || 'application/octet-stream',
        base64: match[2] || ''
    };
}

export function mapMessagePartsToGemini(role, content) {
    const label = String(role || 'user').toUpperCase();
    if (typeof content === 'string') {
        return [{ text: `${label}:\n${content}` }];
    }

    if (!Array.isArray(content)) {
        return [{ text: `${label}:\n${String(content || '')}` }];
    }

    const parts = [{ text: `${label}:` }];
    for (const item of content) {
        if (!item || typeof item !== 'object') continue;

        if (item.type === 'text') {
            parts.push({ text: item.text || '' });
            continue;
        }

        if (item.type === 'image_url') {
            const parsed = parseDataUrl(item.image_url?.url);
            if (parsed?.base64) {
                parts.push({
                    inlineData: {
                        mimeType: parsed.mimeType,
                        data: parsed.base64
                    }
                });
            }
            continue;
        }

        if (item.type === 'input_file' && item.data) {
            parts.push({
                inlineData: {
                    mimeType: item.mimeType || 'application/octet-stream',
                    data: item.data
                }
            });
        }
    }

    return parts;
}

export function validatePlannerPayload(parsed) {
    if (!parsed || typeof parsed !== 'object') {
        return { ok: false, reason: 'Payload is not a JSON object.' };
    }

    if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
        return { ok: false, reason: 'Missing required "summary" string.' };
    }

    if (!Array.isArray(parsed.assumptions)) {
        return { ok: false, reason: 'Missing required "assumptions" array.' };
    }

    if (!parsed.blueprint || typeof parsed.blueprint !== 'object' || Array.isArray(parsed.blueprint)) {
        return { ok: false, reason: 'Missing required "blueprint" object.' };
    }

    if (typeof parsed.blueprint.title !== 'string' || !parsed.blueprint.title.trim()) {
        return { ok: false, reason: 'Missing required "blueprint.title" string.' };
    }

    const hasSections = Array.isArray(parsed.blueprint.sections) && parsed.blueprint.sections.length > 0;
    const hasSteps = Array.isArray(parsed.blueprint.steps) && parsed.blueprint.steps.length > 0;
    if (!hasSections && !hasSteps) {
        return { ok: false, reason: 'Blueprint must include a non-empty "sections" or "steps" array.' };
    }

    return { ok: true };
}

export function normalizeBlueprintForMcp(blueprint) {
    if (!blueprint || typeof blueprint !== 'object') return blueprint;

    const validIntroColors = new Set(['blue', 'orange', 'red', 'gray']);

    const normalizeOptions = (value) => {
        if (typeof value === 'string') return value.trim();
        if (Array.isArray(value)) {
            return value
                .map(item => String(item || '').trim())
                .filter(Boolean)
                .join('\n');
        }
        return '';
    };

    const normalizeField = (field) => {
        if (!field || typeof field !== 'object') return field;

        const normalized = { ...field };

        if (normalized.fieldtype === 'Select') {
            const options = normalizeOptions(normalized.options);
            if (options) {
                normalized.options = options;
            }
        }

        if (normalized.fieldtype === 'Table' && Array.isArray(normalized.table_fields)) {
            normalized.table_fields = normalized.table_fields.map(child => {
                if (!child || typeof child !== 'object') return child;
                const normalizedChild = { ...child };
                if (normalizedChild.fieldtype === 'Select') {
                    const options = normalizeOptions(normalizedChild.options);
                    if (options) {
                        normalizedChild.options = options;
                    }
                }
                return normalizedChild;
            });
        }

        return normalized;
    };

    const normalizeSection = (section) => {
        if (!section || typeof section !== 'object') return section;
        return {
            ...section,
            fields: Array.isArray(section.fields) ? section.fields.map(normalizeField) : section.fields
        };
    };

    return {
        ...blueprint,
        description: typeof blueprint.description === 'string' ? blueprint.description.trim().slice(0, 140) : blueprint.description,
        intro_text: typeof blueprint.intro_text === 'string' ? blueprint.intro_text.trim().slice(0, 160) : blueprint.intro_text,
        intro_color: validIntroColors.has(blueprint.intro_color) ? blueprint.intro_color : 'blue',
        sections: Array.isArray(blueprint.sections) ? blueprint.sections.map(normalizeSection) : blueprint.sections,
        steps: Array.isArray(blueprint.steps)
            ? blueprint.steps.map(step => ({
                ...step,
                sections: Array.isArray(step.sections) ? step.sections.map(normalizeSection) : step.sections
            }))
            : blueprint.steps
    };
}

export function compactAssistSchema(schema) {
    if (!schema || typeof schema !== 'object') return {};

    const compactField = (field) => ({
        fieldname: field?.fieldname,
        fieldtype: field?.fieldtype,
        label: field?.label,
        mandatory: !!(field?.mandatory || field?.reqd),
        read_only: !!field?.read_only,
        hidden: !!field?.hidden,
        depends_on: field?.depends_on,
        mandatory_depends_on: field?.mandatory_depends_on,
        options: typeof field?.options === 'string' ? field.options.slice(0, 160) : field?.options,
        data_group: field?.data_group,
        link_config: field?.link_config ? {
            data_source: field.link_config.data_source,
            mapping: field.link_config.mapping,
            filters: field.link_config.filters
        } : undefined,
        table_fields: Array.isArray(field?.table_fields)
            ? field.table_fields.map((column) => ({
                fieldname: column?.fieldname,
                fieldtype: column?.fieldtype,
                label: column?.label,
                mandatory: !!column?.mandatory
            }))
            : undefined
    });

    const compactSection = (section) => ({
        id: section?.id,
        label: section?.label,
        description: section?.description,
        depends_on: section?.depends_on,
        fields: (section?.columns || []).flatMap(column =>
            (column?.fields || []).map(compactField)
        )
    });

    return {
        name: schema.name,
        description: schema.description,
        is_stepper: !!schema.is_stepper,
        actions: schema.actions,
        metadata: schema.metadata,
        has_client_script: !!schema.client_script,
        steps: (schema.steps || []).map(step => ({
            id: step.id,
            title: step.title,
            description: step.description,
            sections: (step.sections || []).map(compactSection)
        })),
        sections: (schema.sections || []).map(compactSection)
    };
}
