import { useState, useRef, useEffect } from "react";
import { Plus, Mic, Send, Camera, Image as ImageIcon, X, FileAudio } from "lucide-react";

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  // NEW: Hold file in state before sending
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const textareaRef = useRef(null);
  const plusMenuRef = useRef(null);
  
  const cameraInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    setSelectedFileType(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      // Send both text and file simultaneously
      onSendMessage(message, selectedFile, selectedFileType);
      
      setMessage("");
      clearFile();
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

  const handleCamera = () => { cameraInputRef.current?.click(); setShowPlusMenu(false); };
  const handleBrowseImages = () => { imageInputRef.current?.click(); setShowPlusMenu(false); };
  const handleAudioClick = () => { audioInputRef.current?.click(); };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size Validations
    if (type === 'audio' && file.size > 5 * 1024 * 1024) {
      alert("Audio file size must be less than 5 MB.");
      e.target.value = ""; 
      return;
    }
    if (type === 'image' && file.size > 30 * 1024 * 1024) {
      alert("Image file size must be less than 30 MB.");
      e.target.value = ""; 
      return;
    }

    setSelectedFile(file);
    setSelectedFileType(type);
    
    if (type === 'image') {
      setPreviewUrl(URL.createObjectURL(file));
    }

    e.target.value = "";
  };

  return (
    <div className="w-full px-4 pb-6 md:px-6">
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-xl rounded-3xl opacity-70"></div>

        <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-[24px] p-2 shadow-sm transition-all duration-300 focus-within:bg-card/95 focus-within:border-primary/40 focus-within:shadow-md flex flex-col">
          
          {/* FILE PREVIEW UI */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-2 mb-2 mx-2 mt-1 bg-muted/60 border border-border/50 rounded-xl w-max max-w-full relative group animate-fade-in-up">
              {selectedFileType === 'image' ? (
                <img src={previewUrl} alt="preview" className="h-12 w-12 object-cover rounded-lg shadow-sm" />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
                  <FileAudio size={24} />
                </div>
              )}
              <div className="flex flex-col pr-6">
                <span className="text-xs font-semibold text-foreground truncate max-w-[150px] md:max-w-[200px]">
                  {selectedFile.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button 
                onClick={clearFile} 
                className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* TEXT AREA */}
          <textarea
            ref={textareaRef}
            placeholder={selectedFile ? "Add a message about this file (optional)..." : "Ask AI Assistant or select a file..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full bg-transparent outline-none text-foreground placeholder-muted-foreground text-[15px] resize-none overflow-x-hidden overflow-y-auto leading-relaxed max-h-32 px-3 pt-2 pb-1 custom-scrollbar"
            rows={1}
            style={{ minHeight: "44px" }}
          />

          <div className="flex items-center justify-end gap-1.5 pt-1 pr-1">
            <div className="relative" ref={plusMenuRef}>
              <button 
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${showPlusMenu ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>

              {showPlusMenu && (
                <div className="absolute bottom-full right-0 mb-3 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50 py-1.5">
                  <button onClick={handleCamera} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/80 text-sm transition-colors text-foreground font-medium">
                    <Camera className="w-4 h-4 text-primary" />
                    Take Photo
                  </button>
                  <button onClick={handleBrowseImages} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/80 text-sm transition-colors text-foreground font-medium">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Browse Images
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleAudioClick}
              className="p-2 rounded-full transition-all duration-200 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Mic size={18} strokeWidth={2.5} />
            </button>

            <button 
              onClick={handleSend}
              disabled={!message.trim() && !selectedFile}
              className="ml-1 p-2 bg-primary text-primary-foreground hover:opacity-90 rounded-full transition-all duration-200 disabled:opacity-0 disabled:scale-95 disabled:pointer-events-none flex items-center justify-center shadow-sm"
            >
              <Send size={16} strokeWidth={2.5} className="ml-0.5" /> 
            </button>
          </div>
        </div>
      </div>

      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" />
      <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" />
      <input type="file" accept="audio/*" capture="environment" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} className="hidden" />
    </div>
  );
};

export default ChatInput;