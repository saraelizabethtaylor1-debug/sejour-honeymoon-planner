import { useState, useRef, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  defaultMonth?: Date;
}

const inputBase = 'w-full bg-[#fdf8f6] border border-[#e8d0cc] rounded-lg px-4 py-2.5 text-sm font-body text-[#4a3030] focus:outline-none focus:border-[#7d5a58] transition-colors cursor-pointer';

export function CustomDatePicker({ value, onChange, placeholder = 'Select date', className, triggerClassName, defaultMonth }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const displayValue = selected && isValid(selected) ? format(selected, 'MMMM d, yyyy') : '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${triggerClassName ?? inputBase} flex items-center justify-between text-left`}
      >
        <span className={displayValue ? 'text-[#4a3030]' : 'text-[#4a3030]/40'}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon size={14} className="text-[#7d5a58] flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-[9999] bg-white border border-[#e8d0cc] rounded-xl shadow-lg shadow-[#e8d0cc]/30 p-3">
          <DayPicker
            mode="single"
            weekStartsOn={0}
            selected={selected}
            defaultMonth={selected ?? defaultMonth}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, 'yyyy-MM-dd'));
              }
              setOpen(false);
            }}
            className="pointer-events-auto"
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-3',
              caption: 'flex justify-center relative items-center h-10',
              caption_label: 'text-sm font-serif font-medium text-[#7d5a58]',
              nav: 'flex items-center',
              nav_button: 'h-7 w-7 bg-transparent hover:bg-[#e8d0cc]/30 rounded-lg flex items-center justify-center text-[#7d5a58] transition-colors',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse',
              head_row: 'flex',
              head_cell: 'text-[#7d5a58]/60 rounded-md w-9 font-body text-[11px] font-normal',
              row: 'flex w-full mt-1',
              cell: 'text-center text-sm relative p-0 focus-within:relative',
              day: 'h-9 w-9 p-0 font-body text-sm text-[#4a3030] hover:bg-[#e8d0cc]/30 rounded-lg transition-colors flex items-center justify-center',
              day_selected: 'bg-[#e8d0cc] text-white hover:bg-[#d4b5b0] rounded-lg',
              day_today: 'bg-[#d4b5b0]/20 text-[#7d5a58] font-medium rounded-lg',
              day_outside: 'text-[#4a3030]/25',
              day_disabled: 'text-[#4a3030]/25',
            }}
          />
          <div className="flex justify-between mt-2 pt-2 border-t border-[#e8d0cc]/40">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs font-body text-[#7d5a58] hover:text-[#4a3030] transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onChange(format(new Date(), 'yyyy-MM-dd')); setOpen(false); }}
              className="text-xs font-body text-[#7d5a58] hover:text-[#4a3030] transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
