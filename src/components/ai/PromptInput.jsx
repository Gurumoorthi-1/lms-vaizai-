import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  "Generate a 5-question quiz about React Hooks",
  "Create a syllabus outline for Introduction to Python",
  "Summarize the key benefits of component-based architecture",
];

export default function PromptInput({ onSubmit, isGenerating }) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    
    onSubmit(prompt.trim());
    setPrompt('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => setPrompt(suggestion)}
            className="text-xs font-medium px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSubmit}
        className="relative flex items-end bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
      >
        <div className="p-3 shrink-0 self-start">
          <Sparkles className={`h-5 w-5 ${isGenerating ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
        </div>
        
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to generate a syllabus, quiz, or summary..."
          className="w-full max-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-slate-900 dark:text-white placeholder-slate-400 text-sm md:text-base scrollbar-hide"
          rows={1}
          disabled={isGenerating}
        />
        
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="m-2 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white rounded-xl transition-all shrink-0 shadow-sm"
          aria-label="Generate Content"
        >
          {isGenerating ? (
            <div className="h-5 w-5 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
      <div className="text-center mt-2">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          AI generated content may be inaccurate. Please review before publishing to students.
        </span>
      </div>
    </div>
  );
}
