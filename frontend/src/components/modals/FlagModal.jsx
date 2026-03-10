import React, { useState } from "react";
import { Flag, AlertTriangle } from "lucide-react";

const FLAG_OPTIONS = [
  'SPAM',
  'INAPPROPRIATE', 
  'DUPLICATE',
  'ALREADY RESOLVED',
  'SEXUAL CONTENT',
  'ABUSE',
  'OTHER'
];

const FlagModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [selectedFlag, setSelectedFlag] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!selectedFlag) {
      setError("Please select a flag reason");
      return;
    }
    
    setError("");
    onSubmit(selectedFlag);
  };

  const handleClose = () => {
    setSelectedFlag("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-white/90 backdrop-blur flex items-center justify-center z-50 p-4 dark:bg-black/60"
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
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Flag Issue</h2>
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
            <AlertTriangle className="mx-auto w-12 h-12 text-amber-500 mb-3" />
            <p className="text-sm text-muted-foreground">
              Please select a reason for flagging this issue. This helps us understand and review the report appropriately.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Flag Reason <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto thin-scrollbar">
              {FLAG_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedFlag(option);
                    setError("");
                  }}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-xl text-left transition-all duration-200 border ${
                    selectedFlag === option
                      ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                      : "bg-card/50 border-border hover:bg-muted/50 hover:border-border/80"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedFlag === option
                        ? "border-red-500 bg-red-500"
                        : "border-border"
                    }`}>
                      {selectedFlag === option && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl font-semibold border border-border bg-card/50 hover:bg-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !selectedFlag}
              className="flex-1 px-4 py-3 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isLoading ? "Flagging..." : "Flag Issue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlagModal;
