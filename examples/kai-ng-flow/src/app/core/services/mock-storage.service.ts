import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DocumentDefinition } from 'vant-flow';
import { firstValueFrom } from 'rxjs';

export interface FormSubmission {
    id: string;
    formId: string;
    formName: string;
    timestamp: string;
    data: any;
    metadata?: { [key: string]: any };
}

export interface FormDesign {
    id: string;
    schema: DocumentDefinition;
    lastModified: string;
}

@Injectable({ providedIn: 'root' })
export class MockStorageService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:3002/api';

    // Signals for reactive UI
    forms = signal<FormDesign[]>([]);
    submissions = signal<FormSubmission[]>([]);

    constructor() {
        this.loadInitialData();
    }

    private async loadInitialData() {
        try {
            const forms = await firstValueFrom(this.http.get<FormDesign[]>(`${this.API_URL}/forms`));
            this.forms.set(forms);

            const submissions = await firstValueFrom(this.http.get<FormSubmission[]>(`${this.API_URL}/submissions`));
            this.submissions.set(submissions);

            console.log('[MockStorage] Data loaded from Proxy Backend');
        } catch (err) {
            console.error('[MockStorage] Failed to load data from Proxy:', err);
            // Fallback to empty or previous state if needed
        }
    }

    // --- Form Designs ---

    getForms(): FormDesign[] {
        return this.forms();
    }

    getFormById(id: string): FormDesign | undefined {
        return this.forms().find(f => f.id === id);
    }

    async saveForm(schema: DocumentDefinition, id?: string): Promise<string> {
        const finalId = id || Math.random().toString(36).substring(2, 9);
        const design: FormDesign = {
            id: finalId,
            schema,
            lastModified: new Date().toISOString()
        };

        try {
            await firstValueFrom(this.http.post(`${this.API_URL}/forms`, design));

            // Update local state
            const forms = [...this.forms()];
            const index = forms.findIndex(f => f.id === finalId);
            if (index > -1) {
                forms[index] = design;
            } else {
                forms.push(design);
            }
            this.forms.set(forms);

            return finalId;
        } catch (err) {
            console.error('[MockStorage] Failed to save form:', err);
            throw err;
        }
    }

    async deleteForm(id: string) {
        try {
            await firstValueFrom(this.http.delete(`${this.API_URL}/forms/${id}`));

            // Update local state
            this.forms.set(this.forms().filter(f => f.id !== id));
            this.submissions.set(this.submissions().filter(s => s.formId !== id));
        } catch (err) {
            console.error('[MockStorage] Failed to delete form:', err);
            throw err;
        }
    }

    // --- Submissions ---

    getSubmissions(): FormSubmission[] {
        return this.submissions();
    }

    getSubmissionById(id: string): FormSubmission | undefined {
        return this.submissions().find(s => s.id === id);
    }

    async saveSubmission(formId: string, formName: string, data: any, metadata?: any) {
        const newSubmission: FormSubmission = {
            id: 'sub_' + Math.random().toString(36).substring(2, 9),
            formId,
            formName,
            timestamp: new Date().toISOString(),
            data,
            ...(metadata ? { metadata } : {})
        };

        try {
            await firstValueFrom(this.http.post(`${this.API_URL}/submissions`, newSubmission));

            // Update local state (reactive)
            const currentSubmissions = [newSubmission, ...this.submissions()];
            this.submissions.set(currentSubmissions);
        } catch (err) {
            console.error('[MockStorage] Failed to save submission:', err);
            throw err;
        }
    }
}
