import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CustomTimePickerProps {
  value: string; // HH:mm (24h)
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

const inputBase = 'w-full bg-[#fdf8f6] border border-[#e8d0cc] rounded-lg px-4 py-2.5 text-sm font-body text-[#4a3030] focus:outline-none focus:border-[#7d5a58] transition-colors cursor-pointer';

const formatTo12h = (time24: string): string => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

const timeSlots: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 15, 30, 45]) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

export function CustomTimePicker({ value, onChange, placeholder = 'Select time', className, triggerClassName }: CustomTimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && listRef.current && value) {
      const idx = timeSlots.indexOf(value);
      if (idx >= 0) {
        const el = listRef.current.children[idx] as HTMLElement;
        el?.scrollIntoView({ block: 'center' });
      }
    }
  }, [open, value]);

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${triggerClassName ?? inputBase} flex items-center justify-between text-left`}
      >
        <span className={value ? 'text-[#4a3030]' : 'text-[#4a3030]/40'}>
          {value ? formatTo12h(value) : placeholder}
        </span>
        <Clock size={14} className="text-[#7d5a58] flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-[9999] bg-white border border-[#e8d0cc] rounded-xl shadow-lg shadow-[#e8d0cc]/30 w-full max-h-[240px] overflow-y-auto" ref={listRef}>
          {timeSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => { onChange(slot); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm font-body transition-colors ${
                slot === value
                  ? 'bg-[#e8d0cc] text-white'
                  : 'text-[#4a3030] hover:bg-[#e8d0cc]/20'
              }`}
            >
              {formatTo12h(slot)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
