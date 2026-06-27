import React, { useState, useEffect, useRef } from 'react';
import { useAiStore } from '../store/aiStore';
import { generateAIResponse } from '../services/aiService';
import HistorySidebar from '../components/ai/HistorySidebar';
import PromptInput from '../components/ai/PromptInput';
import ResponseCard from '../components/ai/ResponseCard';
import { Menu, X } from 'lucide-react';

export default function AIGenerator() {
  const { history, currentSessionId, startNewSession, addMessage } = useAiStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponseStream, setCurrentResponseStream] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, currentResponseStream]);

  // Ensure there is always an active session
  useEffect(() => {
    if (!currentSessionId) {
      startNewSession();
    }
  }, [currentSessionId, startNewSession]);

  const activeSession = history.find(s => s.id === currentSessionId);
  const messages = activeSession ? activeSession.messages : [];

  const handleGenerate = async (prompt) => {
    if (!prompt.trim() || isGenerating) return;

    // Add user message to history
    addMessage(currentSessionId, 'user', prompt);
    
    setIsGenerating(true);
    setCurrentResponseStream(''); // Clear streaming buffer

    try {
      await generateAIResponse(prompt, (chunk) => {
        setCurrentResponseStream(prev => prev + chunk);
      });
      
      // When done streaming, save to history and clear buffer
      // We need to use functional state update or get the latest stream from a ref if it was complex,
      // but since generateAIResponse resolves when done, we can just grab the final stream state.
      // Actually, since generateAIResponse is fully mocked, it's safer to just let the onChunk populate it,
      // and then we append it here.
    } catch (error) {
      console.error("AI Generation failed", error);
      setCurrentResponseStream("An error occurred while generating the response. Please try again.");
    } finally {
      // Need a slight timeout to ensure the state has the full string before saving
      setTimeout(() => {
        // Use a setState callback to get the absolute latest streaming value
        setCurrentResponseStream((finalStream) => {
          addMessage(currentSessionId, 'assistant', finalStream);
          setIsGenerating(false);
          return ''; // Reset stream
        });
      }, 50);
    }
  };

  const handleRegenerate = () => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      handleGenerate(lastUserMessage.content);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-6 overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <HistorySidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-slate-900 dark:text-white">AI Content Generator</span>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">How can I help you teach today?</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Generate syllabuses, quiz questions, assignment prompts, or summarize complex topics instantly.
              </p>
            </div>
          ) : (
            <div className="pb-32">
              {messages.map((msg, index) => (
                <ResponseCard 
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  onRegenerate={msg.role === 'assistant' && index === messages.length - 1 ? handleRegenerate : null}
                />
              ))}
              
              {/* Active Streaming Response */}
              {isGenerating && currentResponseStream && (
                <ResponseCard 
                  role="assistant"
                  content={currentResponseStream}
                  isTyping={true}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50 dark:from-slate-950 dark:via-slate-950 to-transparent p-4 md:p-6">
          <PromptInput 
            onSubmit={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

      </div>
    </div>
  );
}
