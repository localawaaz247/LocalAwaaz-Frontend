import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close the dropdown if the user clicks outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        // CSS FIXED: Outer wrapper is simply w-full. No forced min-widths that break grids.
        <div className="relative w-full" ref={dropdownRef}>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-card border border-border/50 hover:border-border rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-sm transition-all duration-200"
            >
                <span className="truncate pr-2 text-left">{selectedOption?.label || "Select..."}</span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                // CSS FIXED: w-full and left-0 ensures the menu is the EXACT width of the button above it. 
                // It will never bleed off the screen, get clipped by the modal, or overlap in a grid again!
                <div className="absolute z-[9999] w-full left-0 mt-1.5 bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg sm:rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 origin-top">
                    <div className="max-h-56 overflow-y-auto thin-scrollbar py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors hover:bg-muted/80 ${value === option.value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                                    }`}
                            >
                                <span className="truncate text-left pr-2">{option.label}</span>
                                {value === option.value && <Check size={14} className="text-primary shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;