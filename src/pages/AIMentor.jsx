import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAiStore } from '../store/aiStore';
import { api } from '../services/api';
import {
  MessageSquare, Send, Plus, Trash2, Copy, Check, RefreshCw, Mic,
  Bot, User, Menu, X, Sparkles, PanelLeftClose, PanelLeftOpen, Clock
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Simple Markdown → HTML renderer (no external deps)
   ═══════════════════════════════════════════════════════════════════════════ */
function renderMarkdown(text) {
  if (!text) return '';
  let html = text;

  // Fenced code blocks ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="relative group my-3"><div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onclick="navigator.clipboard.writeText(this.closest('.group').querySelector('code').textContent)" class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600">Copy</button></div><pre class="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-sm font-mono leading-relaxed"><code>${escaped}</code></pre></div>`;
  });

  // Tables |...|
  html = html.replace(/((?:\|.*\|\n)+)/g, (block) => {
    const rows = block.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return block;
    const parseRow = r => r.split('|').filter(c => c.trim() !== '').map(c => c.trim());
    const headers = parseRow(rows[0]);
    const isSep = rows[1] && /^\|[\s:-]+\|$/.test(rows[1].trim());
    const dataRows = rows.slice(isSep ? 2 : 1);
    let table = '<div class="overflow-x-auto my-3"><table class="w-full text-sm border-collapse"><thead><tr>';
    headers.forEach(h => { table += `<th class="text-left px-3 py-2 border-b-2 border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">${h}</th>`; });
    table += '</tr></thead><tbody>';
    dataRows.forEach(r => {
      const cols = parseRow(r);
      table += '<tr>';
      cols.forEach(c => { table += `<td class="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">${c}</td>`; });
      table += '</tr>';
    });
    table += '</tbody></table></div>';
    return table;
  });

  // Blockquotes > text
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-indigo-400 pl-4 py-1 my-2 text-slate-600 dark:text-slate-400 italic">$1</blockquote>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h1>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-700 dark:text-slate-300">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-700 dark:text-slate-300">$1</li>');

  // Wrap consecutive <li> in <ul>/<ol>
  html = html.replace(/((?:<li class="ml-4 list-disc[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-2 space-y-1">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 list-decimal[^>]*>.*<\/li>\n?)+)/g, '<ol class="my-2 space-y-1">$1</ol>');

  // Inline code (must come after code blocks)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  // Bold & italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
}

/* ─── Typing indicator ──────────────────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-start gap-3 px-4 py-3">
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
      <Bot className="h-4 w-4 text-white" />
    </div>
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

/* ─── Prompt suggestion cards ───────────────────────────────────────────── */
const suggestions = [
  { icon: '💡', text: 'Explain React hooks in simple terms' },
  { icon: '⚡', text: 'How do I optimize database queries?' },
  { icon: '🔧', text: 'Best practices for REST API design' },
  { icon: '🔐', text: 'Help me debug my authentication flow' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AIMentor() {
  const { user } = useAuthStore();
  const {
    history, currentSessionId, startNewSession, addMessage,
    deleteSession, setCurrentSession, clearHistory
  } = useAiStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentSession = history.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  /* ── auto-scroll ────────────────────────────────────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  /* ── send message ───────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      startNewSession();
      // startNewSession sets it internally, but let's also use our local copy
      setCurrentSession(sessionId);
    }

    addMessage(sessionId, 'user', text.trim());
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.sendAiMessage(text.trim());
      addMessage(sessionId, 'assistant', response);
    } catch (_e) {
      addMessage(sessionId, 'assistant', 'Sorry, I encountered an error. Please try again.');
    }
    setIsLoading(false);
    inputRef.current?.focus();
  }, [currentSessionId, isLoading, startNewSession, setCurrentSession, addMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewChat = () => {
    const id = crypto.randomUUID();
    setCurrentSession(id);
    setInput('');
  };

  const handleCopy = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async () => {
    if (!currentSession || messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;
    setIsLoading(true);
    try {
      const response = await api.sendAiMessage(lastUserMsg.content);
      addMessage(currentSessionId, 'assistant', response);
    } catch (_e) {
      addMessage(currentSessionId, 'assistant', 'Sorry, I encountered an error. Please try again.');
    }
    setIsLoading(false);
  };

  const handleVoice = () => {
    setInput(prev => prev + (prev ? ' ' : '') + '[Voice input detected]');
    inputRef.current?.focus();
  };

  /* ── auto-resize textarea ───────────────────────────────────────────── */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-8 -mt-4 md:-mt-8 overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative z-40 md:z-auto top-0 bottom-0 left-0 md:translate-x-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shrink-0`}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">AI Mentor</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-all"
          >
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {history.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-xs text-slate-400">No conversations yet</p>
            </div>
          ) : (
            [...history].reverse().map(session => (
              <div
                key={session.id}
                onClick={() => { setCurrentSession(session.id); setSidebarOpen(false); }}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  currentSessionId === session.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={clearHistory}
              className="w-full text-xs font-medium text-slate-400 hover:text-rose-500 py-2 transition-colors"
            >
              Clear all conversations
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Chat Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
        {/* Chat header */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vaizai AI Mentor</h2>
            <p className="text-[10px] text-emerald-500 font-medium">● Online</p>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full px-6 py-12">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Hi{user ? `, ${user.firstName}` : ''}! 👋
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-8">
                I'm your AI learning mentor. Ask me anything about programming, architecture, debugging, or any topic you're studying.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="text-left px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
                  >
                    <span className="text-lg mb-1 block">{s.icon}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3 py-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {msg.role === 'assistant' ? (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-bold text-white">{user?.firstName?.[0] || 'U'}</span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`group relative max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div
                          className="prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                          {copiedId === idx ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          {copiedId === idx ? 'Copied!' : 'Copy'}
                        </button>
                        {idx === messages.length - 1 && (
                          <button
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-40"
                          >
                            <RefreshCw className="h-3 w-3" /> Regenerate
                          </button>
                        )}
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 ml-2">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="text-right mt-1">
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Area ────────────────────────────────────────────────── */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all px-4 py-2">
              <button
                onClick={handleVoice}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 mb-0.5"
                title="Voice input (simulated)"
              >
                <Mic className="h-5 w-5" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none outline-none py-2 max-h-40"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 shrink-0 mb-0.5"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              AI Mentor can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
