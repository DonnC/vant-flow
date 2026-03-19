import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VfMediaHandler, VfStoredMedia } from 'vant-flow';

interface DemoStorageUploadResponse {
    fileId: string;
    publicUrl: string;
    previewUrl?: string;
    downloadUrl?: string;
    metadata?: Record<string, any>;
    name?: string;
    type?: string;
    size?: number;
}

@Injectable({ providedIn: 'root' })
export class DemoMediaService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:3002/api/demo/storage/upload';

    mediaHandler: VfMediaHandler = async (payload, context) => {
        if (payload.fieldtype === 'Signature') {
            return payload.dataUrl;
        }

        const dataUrl = await this.readFileAsDataUrl(payload.file);

        // Demo-only example: only route the "before_media" Attach field through the mock storage proxy.
        // TODO: Replace this hardcoded fieldname check with project-specific upload rules or a real backend policy.
        if (context.fieldname !== 'before_media') {
            return {
                name: payload.file.name,
                size: payload.file.size,
                type: payload.file.type,
                url: dataUrl
            };
        }

        const uploaded = await firstValueFrom(this.http.post<DemoStorageUploadResponse>(this.API_URL, {
            fieldtype: payload.fieldtype,
            name: payload.file.name,
            type: payload.file.type,
            size: payload.file.size,
            dataUrl,
            metadata: {
                demoFieldname: context.fieldname,
                example: 'field-service-work-order'
            }
        }));

        return {
            name: uploaded.name || payload.file.name,
            size: uploaded.size || payload.file.size,
            type: uploaded.type || payload.file.type,
            url: uploaded.previewUrl || uploaded.publicUrl,
            downloadUrl: uploaded.downloadUrl || uploaded.publicUrl,
            fileId: uploaded.fileId,
            metadata: uploaded.metadata
        } satisfies VfStoredMedia;
    };

    private readFileAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error(`Failed to read file ${file.name}.`));
            reader.readAsDataURL(file);
        });
    }
}
