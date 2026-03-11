import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

const ShareLinkModal = ({ isOpen, onClose, shareLink }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-border/50 bg-muted/20">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Share2 size={16} className="text-primary" />
            </div>
            Share Issue
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 md:p-5">
          <p className="text-sm text-muted-foreground mb-4 text-center md:text-left">
            Share this link with others to let them view this issue.
          </p>
          
          <div className="mb-2">
            <label className="block text-xs font-semibold text-foreground mb-1.5">Share Link</label>
            {/* THIS IS THE RESPONSIVE FIX: flex-col on mobile, flex-row on sm screens */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={shareLink} 
                className="w-full bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
              />
              <button 
                onClick={handleCopy}
                className={`w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  copied 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : 'btn-gradient text-white hover:opacity-90 shadow-sm'
                }`}
              >
                {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground text-center md:text-left mt-3">
            Anyone with this link can view this issue.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;