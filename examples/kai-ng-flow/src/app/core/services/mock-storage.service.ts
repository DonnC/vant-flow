import { Injectable, signal } from '@angular/core';
import { DocumentDefinition } from 'vant-flow';

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
    private readonly FORMS_KEY = 'vant_flow_designs';
    private readonly SUBMISSIONS_KEY = 'vant_flow_submissions';

    // Signals for reactive UI
    forms = signal<FormDesign[]>([]);
    submissions = signal<FormSubmission[]>([]);

    constructor() {
        this.loadInitialData();
    }

    private loadInitialData() {
        const savedForms = localStorage.getItem(this.FORMS_KEY);
        const savedSubmissions = localStorage.getItem(this.SUBMISSIONS_KEY);

        if (savedForms) {
            this.forms.set(JSON.parse(savedForms));
        }
        if (savedSubmissions) {
            this.submissions.set(JSON.parse(savedSubmissions));
        }
    }

    // --- Form Designs ---

    getForms(): FormDesign[] {
        return this.forms();
    }

    getFormById(id: string): FormDesign | undefined {
        return this.forms().find(f => f.id === id);
    }

    saveForm(schema: DocumentDefinition, id?: string): string {
        const forms = [...this.forms()];
        const finalId = id || Math.random().toString(36).substring(2, 9);
        const index = forms.findIndex(f => f.id === finalId);

        const design: FormDesign = {
            id: finalId,
            schema,
            lastModified: new Date().toISOString()
        };

        if (index > -1) {
            forms[index] = design;
        } else {
            forms.push(design);
        }

        this.forms.set(forms);
        this.persistForms();
        return finalId;
    }

    deleteForm(id: string) {
        const forms = this.forms().filter(f => f.id !== id);
        this.forms.set(forms);
        this.persistForms();

        // Also cleanup submissions for this form
        const submissions = this.submissions().filter(s => s.formId !== id);
        this.submissions.set(submissions);
        this.persistSubmissions();
    }

    private persistForms() {
        localStorage.setItem(this.FORMS_KEY, JSON.stringify(this.forms()));
    }

    // --- Submissions ---

    getSubmissions(): FormSubmission[] {
        return this.submissions();
    }

    getSubmissionById(id: string): FormSubmission | undefined {
        return this.submissions().find(s => s.id === id);
    }

    saveSubmission(formId: string, formName: string, data: any, metadata?: any) {
        const submissions = [...this.submissions()];
        const newSubmission: FormSubmission = {
            id: 'sub_' + Math.random().toString(36).substring(2, 9),
            formId,
            formName,
            timestamp: new Date().toISOString(),
            data,
            ...(metadata ? { metadata } : {}) // conditionally add
        };

        submissions.unshift(newSubmission);
        this.submissions.set(submissions);
        this.persistSubmissions();
    }

    private persistSubmissions() {
        localStorage.setItem(this.SUBMISSIONS_KEY, JSON.stringify(this.submissions()));
    }
}
