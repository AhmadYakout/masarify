import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithCoach } from '../services/aiService';

const AICoach: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Ahlan ya basha! 👋 Ana el Coach beta3ak. 3aiz tes2al 3an eh elnaharda? Dahab, Aqsat, wala saving tips?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await chatWithCoach(messages, input);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: 'Ma3lesh ya kbeerr, fe moshkela fel etsal. Garab tany!' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format text (Bold **text**, lists, newlines)
  const formatText = (text: string) => {
    return text.split('\n').map((line, lineIndex) => {
      // Handle Bullet Points
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ');
      const cleanLine = line.replace(/^[\*\-•]\s/, '');

      // Parse Bold (**text**)
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIndex} className="flex items-start space-x-2 my-1">
            <span className="text-cib-blue mt-1.5 text-[8px]">●</span>
            <p className="flex-1">{parts}</p>
          </div>
        );
      }
      
      // Regular paragraph line
      return line.trim() === '' ? <div key={lineIndex} className="h-2"/> : <p key={lineIndex} className="min-h-[1em]">{parts}</p>;
    });
  };

  return (
    // Main Container: Fixed height using dvh (dynamic viewport height) minus Nav bar (64px)
    <div className="flex flex-col h-[calc(100dvh-64px)] bg-gray-50">
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cib-blue rounded-full flex items-center justify-center text-xl shadow-md border-2 border-white">
            🕶️
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">El Coach</h2>
            <p className="text-[10px] text-gray-500 font-medium flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
              Masry 100%
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                msg.role === 'user'
                  ? 'bg-cib-blue text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.role === 'user' ? msg.text : formatText(msg.text)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex space-x-1.5 items-center">
              <span className="text-xs text-gray-400 font-medium mr-1">Byefakar...</span>
              <div className="w-1.5 h-1.5 bg-cib-blue rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-cib-blue rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-cib-blue rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        
        {/* Spacer for bottom scrolling */}
        <div className="h-2" />
      </div>

      {/* Input Area - Stays at bottom of this container */}
      <div className="bg-white border-t border-gray-200 p-3 pb-4">
        <form onSubmit={handleSend} className="flex items-end space-x-2 max-w-md mx-auto">
          <div className="flex-1 bg-gray-100 rounded-2xl border border-transparent focus-within:border-cib-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-cib-blue/20 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ekteb hena ya basha..."
              className="w-full p-3 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-full shadow-md transition-all duration-200 ${
              isLoading || !input.trim() 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-cib-blue text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AICoach;