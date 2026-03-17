import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockStorageService, FormDesign } from '../../core/services/mock-storage.service';
import { AiFormService } from '../../core/services/ai-form.service';
import { VfRenderer, VfToastOutlet, DocumentDefinition } from 'vant-flow';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-runner',
  standalone: true,
  imports: [CommonModule, RouterLink, VfRenderer, VfToastOutlet, FormsModule],
  template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col">
      <header class="h-14 bg-white border-b border-zinc-200 flex items-center px-6 gap-4 shrink-0 shadow-sm z-50">
        <a routerLink="/user" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </a>
        <div class="flex items-center gap-2">
           <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Document Runner</span>
           <span class="text-zinc-300">/</span>
           <span class="text-sm font-black text-zinc-900 tracking-tight">{{ form?.schema?.name || 'Loading...' }}</span>
        </div>
        <div class="flex-1"></div>
        
        <div class="h-6 w-px bg-zinc-200 mx-2"></div>

        <button (click)="isChatOpen.set(!isChatOpen())" class="flex items-center gap-2 bg-violet-50 text-violet-700 hover:bg-violet-100 px-4 py-2 rounded-xl transition-colors font-bold text-xs">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
           AI ASSISTANT
        </button>
        
        <div class="flex items-center gap-2 border-l border-zinc-200 pl-4 h-6">
           <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Live Session</span>
        </div>
      </header>

      <main class="flex-1 overflow-hidden relative flex">
        @if (form) {
          <div class="flex-1 overflow-y-auto pt-10 pb-20 px-4 transition-all duration-300" [class.mr-96]="isChatOpen()">
             <div class="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <vf-renderer 
                  #renderer
                  [document]="form.schema" 
                  (formSubmit)="onFormSubmit($event)"
                ></vf-renderer>
             </div>
          </div>
          
          <!-- AI Assistant Side Panel -->
          <div class="absolute right-0 top-0 bottom-0 bg-white border-l border-zinc-200 shadow-2xl flex flex-col transition-transform duration-300 z-40 transform" 
               [style.width.px]="chatWidth()"
               [class.translate-x-full]="!isChatOpen()" 
               [class.translate-x-0]="isChatOpen()">
             
             <!-- Resize Handle -->
             <div class="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-violet-400/20 active:bg-violet-400/40 transition-colors z-50 group"
                  (mousedown)="startResizing($event)">
                <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-zinc-200 group-hover:bg-violet-300 transition-colors"></div>
             </div>
             
             <!-- Chat Header -->
             <div class="h-14 border-b border-zinc-100 flex items-center justify-between px-6 shrink-0 bg-zinc-50/50">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-violet-600"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                   </div>
                   <div>
                     <h3 class="text-sm font-bold text-zinc-900 leading-tight">Vant AI Assistant</h3>
                      <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Powered by Vant AI Proxy</p>
                   </div>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="clearChat()" class="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors" title="Clear Chat">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                  <button (click)="isChatOpen.set(false)" class="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
             </div>
 
             <!-- Chat Messages -->
             <div #scrollContainer class="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 font-sans ui-custom-scrollbar scroll-smooth">
                @for (msg of chatMessages(); track $index) {
                   <div class="flex gap-4 group" [class.flex-row-reverse]="msg.role === 'user'">
                      <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm" 
                           [class.bg-violet-100]="msg.role === 'model'" 
                           [class.bg-zinc-200]="msg.role === 'user'">
                         @if (msg.role === 'model') {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-violet-600"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                         } @else {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                         }
                      </div>
                      <div class="max-w-[85%] flex flex-col items-start gap-1" [class.items-end]="msg.role === 'user'">
                        <div class="rounded-2xl p-4 text-sm shadow-sm relative group/bubble"
                             [ngClass]="{
                               'bg-white border border-zinc-200 text-zinc-700': msg.role === 'model',
                               'bg-violet-600 text-white': msg.role === 'user'
                             }">
                          
                          <div class="prose prose-sm max-w-none prose-zinc" [innerHTML]="parseMarkdown(msg.content)"></div>
                          
                          <!-- Copy Button -->
                          <button (click)="copyToClipboard(msg.content)" 
                                  class="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-zinc-100/50 hover:bg-zinc-100 text-zinc-500"
                                  [ngClass]="{
                                    'bg-violet-500/50 hover:bg-violet-500 text-violet-100': msg.role === 'user'
                                  }"
                                  title="Copy message">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          </button>
                        </div>
                        <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mx-1">
                          {{ msg.timestamp | date:'shortTime' }}
                        </span>
                      </div>
                   </div>
                }
                
                @if (isAiTyping()) {
                   <div class="flex gap-4">
                      <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-violet-100 animate-pulse">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-violet-600"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                      </div>
                      <div class="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center gap-1.5 h-[52px]">
                         <div class="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                         <div class="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                         <div class="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                      </div>
                   </div>
                }
             </div>
 
             <!-- Chat Input -->
             <div class="p-4 border-t border-zinc-100 bg-white shrink-0 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
                <div class="relative flex items-end gap-2 bg-zinc-50 border border-zinc-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent transition-all">
                  <textarea [(ngModel)]="chatInput" 
                            (keydown.enter)="handleEnter($event)"
                            (input)="adjustHeight($event)"
                            class="flex-1 bg-transparent border-none text-sm text-zinc-800 p-2.5 focus:outline-none resize-none min-h-[44px] max-h-[200px] ui-custom-scrollbar leading-relaxed"
                            placeholder="Type a message or Shift+Enter for newline..."></textarea>
                  <button (click)="sendMessage()" 
                          [disabled]="!chatInput.trim() || isAiTyping()"
                          class="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-md shadow-violet-500/20 active:scale-95">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
                <div class="flex items-center justify-between mt-3 px-1">
                   <p class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">AI can make mistakes. Verify data.</p>
                   <div class="text-[9px] font-bold text-zinc-300 uppercase">Enter to send</div>
                </div>
             </div>
          </div>
        } @else if (loading()) {
           <div class="h-full flex flex-col items-center justify-center py-40">
              <div class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p class="text-xs font-bold text-zinc-400 uppercase">Fetching Schema...</p>
           </div>
        } @else {
           <div class="h-full flex flex-col items-center justify-center py-40 text-center">
              <h3 class="text-lg font-bold text-zinc-800">Form Not Found</h3>
              <p class="text-sm text-zinc-400 mt-1 mb-6">The document template you're looking for doesn't exist.</p>
              <a routerLink="/user" class="ui-btn-primary px-8">Back to Portal</a>
           </div>
        }
      </main>
      
      <vf-toast-outlet></vf-toast-outlet>
    </div>
  `
})
export class FormRunnerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storage = inject(MockStorageService);
  ai = inject(AiFormService);

  @ViewChild('renderer') renderer!: VfRenderer;
  @ViewChild('scrollContainer') scrollContainer!: any;

  form: FormDesign | null = null;
  loading = signal(true);

  // Chat State
  isChatOpen = signal(false);
  isAiTyping = signal(false);
  chatInput = '';
  chatWidth = signal(400); // Default width
  chatMessages = signal<{ role: 'user' | 'model', content: string, timestamp: Date }[]>([
    {
      role: 'model',
      content: 'Hi! I am the **Vant Flow AI Assistant**. Describe what you need populated, or ask me questions about this form structure.',
      timestamp: new Date()
    }
  ]);
  aiManipulated = false; // Flag to track if AI ever modified the form

  // Resizing logic
  private isResizing = false;

  startResizing(e: MouseEvent) {
    this.isResizing = true;
    const startX = e.clientX;
    const startWidth = this.chatWidth();

    const mouseMove = (moveEvent: MouseEvent) => {
      if (!this.isResizing) return;
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(800, Math.max(300, startWidth + delta));
      this.chatWidth.set(newWidth);
    };

    const mouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
    };

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  }

  clearChat() {
    this.chatMessages.set([
      {
        role: 'model',
        content: 'Chat history cleared. How can I help you next?',
        timestamp: new Date()
      }
    ]);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // You could inject VfToastService here for a "Copied!" message
  }

  parseMarkdown(content: string): string {
    if (!content) return '';

    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-800 text-zinc-100 p-3 rounded-lg my-2 overflow-x-auto text-[11px] font-mono leading-relaxed">$1</pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-100 text-violet-600 px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black text-zinc-900">$1</strong>');

    // Italics
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // Lists
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }

  adjustHeight(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.form = this.storage.getFormById(id) || null;
        this.loading.set(false);
      }
    });
  }

  onFormSubmit(data: any) {
    if (!this.form) return;

    // Attach AI Submission marker if the AI Assistant ever touched the form
    const metadata = this.aiManipulated ? { ai_submitted: true } : {};

    // In a real app, this would be an API call
    this.storage.saveSubmission(this.form.id, this.form.schema.name, data, metadata);

    // Simulate some delay for realism
    setTimeout(() => {
      this.router.navigate(['/user'], { queryParams: { submitted: '1' } });
    }, 800);
  }

  handleEnter(e: any) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    if (!this.chatInput.trim() || !this.form) return;

    const userText = this.chatInput.trim();
    this.chatInput = '';

    // Reset textarea height
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.style.height = '44px';
    });

    this.chatMessages.update(m => [...m, {
      role: 'user',
      content: userText,
      timestamp: new Date()
    }]);
    this.isAiTyping.set(true);
    this.scrollToBottom();

    // Extract current data from VfRenderer's Context
    let currentData = {};
    try {
      currentData = (this.renderer.ctx as any).formData;
    } catch (e) {
      console.warn("Could not get renderer context state", e);
    }

    const rawResponse = await this.ai.getChatFormAssistance(this.chatMessages(), this.form.schema, currentData);

    this.isAiTyping.set(false);

    // Attempt to strictly parse JSON. If it contains JSON blocks, extract them.
    let jsonStr = rawResponse;
    const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // just try to find curly braces
      const firstBrace = rawResponse.indexOf('{');
      const lastBrace = rawResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = rawResponse.substring(firstBrace, lastBrace + 1);
      }
    }

    try {
      // If we found JSON, try to apply it to the form
      const parsed = JSON.parse(jsonStr);

      let updatedFieldsCount = 0;
      Object.keys(parsed).forEach(key => {
        this.renderer.ctx.set_value(key, parsed[key]);
        updatedFieldsCount++;
      });

      this.aiManipulated = true;

      // Form a readable assistant message stripping out the raw JSON since it applied it
      const messageContent = rawResponse.replace(/```json\n([\s\S]*?)\n```/, '').trim() ||
        `I have successfully updated ${updatedFieldsCount} field(s) for you!`;

      this.chatMessages.update(m => [...m, {
        role: 'model',
        content: messageContent,
        timestamp: new Date()
      }]);

    } catch (err) {
      // No valid JSON was generated, likely a conversational response
      this.chatMessages.update(m => [...m, {
        role: 'model',
        content: rawResponse,
        timestamp: new Date()
      }]);
    }
    this.isAiTyping.set(false);
    this.scrollToBottom();
  }

}
