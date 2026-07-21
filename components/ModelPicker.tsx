import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { AIModelType } from '../types';
import { AI_MODELS, getAIModel } from '../models';

interface ModelPickerProps {
  value: AIModelType;
  onChange: (model: AIModelType) => void;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getAIModel(value);
  const CurrentIcon = current.Icon;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition-colors"
      >
        <CurrentIcon size={14} strokeWidth={2} className="text-stone-600 shrink-0" />
        <span className="text-sm font-medium text-stone-800 tracking-tight">{current.label}</span>
        <ChevronDown
          size={14}
          className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="AI model"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-stone-200 bg-white shadow-lg shadow-stone-900/5 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {AI_MODELS.map(({ id, label, hint, Icon }) => {
            const selected = id === value;
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  selected ? 'bg-stone-100' : 'hover:bg-stone-50'
                }`}
              >
                <span
                  className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    selected ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Icon size={14} strokeWidth={2} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-900">{label}</span>
                    {selected && <Check size={14} className="text-stone-500" />}
                  </span>
                  <span className="block text-xs text-stone-500 mt-0.5">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
