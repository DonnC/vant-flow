import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideMonacoEditor, NgxMonacoEditorConfig } from 'ngx-monaco-editor-v2';
import { provideQuillConfig, QuillConfig } from 'ngx-quill';
import QuillTableBetter from "quill-table-better";

/**
 * Default configuration for Monaco Editor.
 */
export const DEFAULT_MONACO_CONFIG: NgxMonacoEditorConfig = {
    baseUrl: 'assets/monaco-editor/vs',
    defaultOptions: {
        scrollBeyondLastLine: false,
        automaticLayout: true
    },
};

/**
 * Default configuration for Quill Editor.
 */
export const DEFAULT_QUILL_CONFIG: QuillConfig = {
    modules: {
        table: false, // disable default table module
        'table-better': {
            columnMinWidth: 100,
            language: 'en_US',
            menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
            toolbarTable: true,
        },
        keyboard: {
            bindings: (QuillTableBetter as any).keyboardBindings,
        },
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike', 'clean'],
            [{ color: [] }, { background: [] }],
            ['blockquote', 'code-block', 'table-better'],
            ['link', 'image'],
            [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
            [{ align: [] }, { indent: '-1' }, { indent: '+1' }, { font: [] }]
        ]
    }
};

/**
 * Configuration options for Vant Flow.
 */
export interface VfFlowConfig {
    /** Custom Monaco Editor configuration. */
    monaco?: NgxMonacoEditorConfig;
    /** Custom Quill Editor configuration. */
    quill?: QuillConfig;
}

/**
 * Provides the necessary configuration for Vant Flow library.
 * This includes Monaco Editor and Quill Editor setup with sensible defaults.
 * 
 * @param config Optional configuration to override defaults.
 */
export function provideVfFlow(config?: VfFlowConfig): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideMonacoEditor(config?.monaco || DEFAULT_MONACO_CONFIG),
        provideQuillConfig(config?.quill || DEFAULT_QUILL_CONFIG)
    ]);
}
