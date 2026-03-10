import React, { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

const ShareLinkModal = ({ isOpen, onClose, shareLink }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      
      // Close modal after short delay to show "Copied!" feedback
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(true);
      setTimeout(() => {
        handleClose();
      }, 800);
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}
    >
      <div 
        className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Share Issue</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-card/50 border border-border/50 flex items-center justify-center hover:bg-muted/50 transition-all duration-200 hover:scale-105"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Share this link with others to let them view this issue
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground text-sm font-mono"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] ${
                  copied 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'btn-gradient text-white hover:scale-[1.02]'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-4">
            Anyone with this link can view this issue
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;
