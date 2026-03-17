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
        
        <!-- AI Toggle -->
        <div class="flex items-center gap-2 mr-4 border border-zinc-200 bg-zinc-50 rounded-xl p-1">
           <button (click)="toggleAi()" 
             class="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all"
             [class.bg-white]="ai.isAiEnabled()"
             [class.shadow-sm]="ai.isAiEnabled()"
             [class.text-violet-600]="ai.isAiEnabled()"
             [class.text-zinc-400]="!ai.isAiEnabled()"
           >
             REAL AI
           </button>
           <button (click)="ai.disableRealModel()" 
             class="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all"
             [class.bg-white]="!ai.isAiEnabled()"
             [class.shadow-sm]="!ai.isAiEnabled()"
             [class.text-zinc-600]="!ai.isAiEnabled()"
             [class.text-zinc-400]="ai.isAiEnabled()"
           >
             MOCK AI
           </button>
        </div>

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
          <div class="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-zinc-200 shadow-2xl flex flex-col transition-transform duration-300 z-40 transform" 
               [class.translate-x-full]="!isChatOpen()" 
               [class.translate-x-0]="isChatOpen()">
             
             <!-- Chat Header -->
             <div class="h-14 border-b border-zinc-100 flex items-center justify-between px-6 shrink-0 bg-zinc-50/50">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-violet-600"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                   </div>
                   <div>
                     <h3 class="text-sm font-bold text-zinc-900 leading-tight">Vant AI</h3>
                     <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{{ ai.isAiEnabled() ? 'Gemini 2.5 Flash' : 'Mock Mode' }}</p>
                   </div>
                </div>
                <button (click)="isChatOpen.set(false)" class="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
             </div>

             <!-- Chat Messages -->
             <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 font-sans ui-custom-scrollbar">
                @for (msg of chatMessages(); track $index) {
                   <div class="flex gap-4" [class.flex-row-reverse]="msg.role === 'user'">
                      <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" 
                           [class.bg-violet-100]="msg.role === 'model'" 
                           [class.bg-zinc-200]="msg.role === 'user'">
                         @if (msg.role === 'model') {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-violet-600"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                         } @else {
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                         }
                      </div>
                      <div class="max-w-[75%] rounded-2xl p-4 text-sm shadow-sm"
                           [class.bg-white]="msg.role === 'model'"
                           [class.border]="msg.role === 'model'"
                           [class.border-zinc-200]="msg.role === 'model'"
                           [class.text-zinc-700]="msg.role === 'model'"
                           [class.bg-violet-600]="msg.role === 'user'"
                           [class.text-white]="msg.role === 'user'">
                         {{ msg.content }}
                      </div>
                   </div>
                }
                
                @if (isAiTyping()) {
                   <div class="flex gap-4">
                      <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-violet-100">
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
             <div class="p-4 border-t border-zinc-100 bg-white shrink-0">
                <div class="relative flex items-end gap-2 bg-zinc-50 border border-zinc-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent transition-all">
                  <textarea [(ngModel)]="chatInput" 
                            (keydown.enter)="handleEnter($event)"
                            class="flex-1 bg-transparent border-none text-sm text-zinc-800 p-2 focus:outline-none resize-none h-[40px] max-h-[120px] ui-custom-scrollbar"
                            placeholder="Ask AI to fill this..."></textarea>
                  <button (click)="sendMessage()" 
                          [disabled]="!chatInput.trim() || isAiTyping()"
                          class="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
                <div class="text-center mt-3">
                   <p class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">AI can make mistakes. Verify data.</p>
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

  form: FormDesign | null = null;
  loading = signal(true);

  // Chat State
  isChatOpen = signal(false);
  isAiTyping = signal(false);
  chatInput = '';
  chatMessages = signal<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: 'Hi! I am the Vant Flow AI Assistant. Describe what you need populated, or ask me questions about this form structure.' }
  ]);
  aiManipulated = false; // Flag to track if AI ever modified the form

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

  toggleAi() {
    const key = prompt('Enter your Google Gemini API Key:');
    if (key) {
      this.ai.setupRealModel(key);
    }
  }

  handleEnter(e: Event) {
    e.preventDefault();
    this.sendMessage();
  }

  async sendMessage() {
    if (!this.chatInput.trim() || !this.form) return;

    const userText = this.chatInput.trim();
    this.chatInput = '';

    this.chatMessages.update(m => [...m, { role: 'user', content: userText }]);
    this.isAiTyping.set(true);

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

      this.chatMessages.update(m => [...m, { role: 'model', content: messageContent }]);

    } catch (err) {
      // No valid JSON was generated, likely a conversational response
      this.chatMessages.update(m => [...m, { role: 'model', content: rawResponse }]);
    }
  }
}
