import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAiStore = create(
  persist(
    (set, get) => ({
      history: [],
      currentSessionId: null,
      
      startNewSession: () => set({ currentSessionId: crypto.randomUUID() }),
      
      addMessage: (sessionId, role, content) => set((state) => {
        const history = [...state.history];
        const sessionIndex = history.findIndex(s => s.id === sessionId);
        
        if (sessionIndex >= 0) {
          history[sessionIndex].messages.push({ role, content, timestamp: new Date().toISOString() });
        } else {
          history.push({
            id: sessionId,
            title: content.substring(0, 30) + '...',
            messages: [{ role, content, timestamp: new Date().toISOString() }],
            createdAt: new Date().toISOString(),
          });
        }
        
        return { history };
      }),

      clearHistory: () => set({ history: [], currentSessionId: null }),
      
      deleteSession: (id) => set((state) => ({
        history: state.history.filter(s => s.id !== id),
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId
      })),
      
      setCurrentSession: (id) => set({ currentSessionId: id }),
    }),
    {
      name: 'vaizai-ai-storage',
    }
  )
);
