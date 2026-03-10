import { useState, useRef, useEffect } from "react";
import { Plus, Mic, SlidersHorizontal, ChevronDown, Send } from "lucide-react";

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full  px-6 pb-6">
      <div className="relative max-w-4xl mx-auto ">
        
        {/* Glow Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 blur-xl rounded-2xl"></div>

        {/* Input Container */}
        <div className="relative flex flex-col gap-3 glass-card border border-border/50 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md min-h-[60px]">

          {/* Textarea - takes remaining space */}
          <textarea
            ref={textareaRef}
            placeholder="Ask AI Assistant..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-sm resize-none overflow-hidden leading-6 min-h-[30px] max-h-32 py-1"
            rows={1}
          />

          {/* Bottom row with buttons */}
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-3 text-muted-foreground">
              <button className="hover:text-accent transition">
                <Plus size={20} />
              </button>

              <button className="flex items-center gap-2 text-sm hover:text-accent transition">
                <SlidersHorizontal size={18} />
                Tools
              </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3 text-muted-foreground">
              <button className="flex items-center gap-1 text-sm hover:text-accent transition">
                Fast
                <ChevronDown size={16} />
              </button>

              <button className="hover:text-accent transition">
                <Mic size={20} />
              </button>

              <button 
                onClick={handleSend}
                disabled={!message.trim()}
                className="p-2 text-accent hover:text-accent/80 hover:bg-accent/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;