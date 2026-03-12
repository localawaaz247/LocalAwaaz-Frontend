import { useState, useRef, useEffect } from "react";
import { Plus, Mic, Send, Camera, Image as ImageIcon, X, FileAudio, Trash2, Square } from "lucide-react";

const ChatInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  // File holding states
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const textareaRef = useRef(null);
  const plusMenuRef = useRef(null);
  
  const cameraInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !isRecording) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message, isRecording]);

  // Click outside to close Plus Menu
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
      onSendMessage(message.trim(), selectedFile, selectedFileType);
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

  // --- MENU HANDLERS ---
  const handleCamera = () => { cameraInputRef.current?.click(); setShowPlusMenu(false); };
  const handleBrowseImages = () => { imageInputRef.current?.click(); setShowPlusMenu(false); };
  const handleBrowseAudio = () => { audioInputRef.current?.click(); setShowPlusMenu(false); };

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // --- AUDIO RECORDING HANDLERS ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop()); // Release mic
        
        if (isCancelledRef.current) return; // Ignore if user canceled

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], "voice_message.webm", { type: 'audio/webm' });

        if (file.size > 5 * 1024 * 1024) {
          alert("Recorded audio exceeds 5 MB limit. Please try a shorter message.");
          return;
        }

        setSelectedFile(file);
        setSelectedFileType('audio');
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    stopRecording();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Dynamic state for Send button
  const hasContent = message.trim().length > 0 || selectedFile !== null;

  return (
    <div className="w-full px-2 pb-2 md:px-6 md:pb-6">
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-xl rounded-3xl opacity-70"></div>

        <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-[24px] p-2 shadow-sm transition-all duration-300 focus-within:bg-card/95 focus-within:border-primary/40 focus-within:shadow-md flex flex-col min-h-[60px] justify-center">
          
          {isRecording ? (
            // --- LIVE RECORDING UI ---
            <div className="flex items-center justify-between w-full px-3 py-1 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                <span className="text-sm font-medium text-foreground tracking-widest">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={cancelRecording} 
                  className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                  title="Cancel Recording"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={stopRecording} 
                  className="p-2.5 bg-primary text-primary-foreground rounded-full hover:opacity-90 shadow-md transition-all scale-105"
                  title="Stop & Attach"
                >
                  <Square size={16} fill="currentColor" />
                </button>
              </div>
            </div>
          ) : (
            // --- STANDARD CHAT UI ---
            <>
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

              <div className="flex items-end w-full">
                {/* Text Area */}
                <textarea
                  ref={textareaRef}
                  placeholder={selectedFile ? "Add a message about this file (optional)..." : "Message LokAI..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-[15px] resize-none overflow-x-hidden overflow-y-auto leading-relaxed max-h-32 px-3 py-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  rows={1}
                  style={{ minHeight: "44px" }}
                />

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 pb-1.5 pr-1">
                  
                  {/* PLUS MENU */}
                  <div className="relative" ref={plusMenuRef}>
                    <button 
                      onClick={() => setShowPlusMenu(!showPlusMenu)}
                      className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${showPlusMenu ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <Plus size={20} strokeWidth={2.5} />
                    </button>

                    {showPlusMenu && (
                      <div className="absolute bottom-full right-0 mb-3 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50 py-1.5">
                        <button onClick={handleCamera} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/80 text-sm transition-colors text-foreground font-medium">
                          <Camera className="w-4 h-4 text-primary" />
                          Take Photo
                        </button>
                        <button onClick={handleBrowseImages} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/80 text-sm transition-colors text-foreground font-medium">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          Upload Image
                        </button>
                        <button onClick={handleBrowseAudio} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/80 text-sm transition-colors text-foreground font-medium">
                          <FileAudio className="w-4 h-4 text-primary" />
                          Upload Audio
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DYNAMIC SEND / MIC BUTTON */}
                  {hasContent ? (
                    <button 
                      onClick={handleSend}
                      className="p-2 bg-primary text-primary-foreground hover:opacity-90 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm scale-100 animate-in zoom-in"
                    >
                      <Send size={18} strokeWidth={2.5} className="ml-0.5" /> 
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="p-2 rounded-full transition-all duration-200 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground scale-100 animate-in zoom-in"
                      title="Record Audio"
                    >
                      <Mic size={20} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" />
      <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} className="hidden" />
      <input type="file" accept="audio/*" ref={audioInputRef} onChange={(e) => handleFileChange(e, 'audio')} className="hidden" />
    </div>
  );
};

export default ChatInput;