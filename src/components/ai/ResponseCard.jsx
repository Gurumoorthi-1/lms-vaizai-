import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download, RefreshCw, Bot, User } from 'lucide-react';

export default function ResponseCard({ role, content, isTyping, onRegenerate }) {
  const [copied, setCopied] = useState(false);

  const isAI = role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-content-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex gap-4 w-full p-6 ${isAI ? 'bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800' : 'bg-transparent'}`}>
      
      {/* Avatar */}
      <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-white shadow-sm mt-1
        ${isAI ? 'bg-indigo-600' : 'bg-slate-800 dark:bg-slate-700'}`}
      >
        {isAI ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-4 max-w-4xl overflow-hidden">
        
        {/* Name / Header */}
        <div className="font-bold text-sm text-slate-900 dark:text-white">
          {isAI ? 'Vaizai AI' : 'You'}
        </div>

        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
          {isAI ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
          
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1 align-middle" />
          )}
        </div>

        {/* Action Buttons (Only for AI completed responses) */}
        {isAI && !isTyping && content.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title="Download as Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                title="Regenerate response"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
