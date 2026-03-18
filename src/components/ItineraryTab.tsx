import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { ItineraryDay } from '@/types/honeymoon';

interface ItineraryTabProps {
  days: ItineraryDay[];
}

const ItineraryItem = ({ day }: { day: ItineraryDay }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 bg-primary pill-shape shadow-soft"
      >
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg text-primary-foreground">{day.dayLabel}</span>
          <span className="text-primary-foreground/30">|</span>
          <span className="font-serif text-primary-foreground/70">{day.destination}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={18} className="text-primary-foreground" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-6"
          >
            <div className="py-6 space-y-5 border-l-2 border-primary ml-4 pl-6">
              {day.activities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic">No activities planned yet</p>
              ) : (
                day.activities.map((act, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                    <p className="text-label mb-1">{act.time}</p>
                    <h4 className="font-serif text-lg text-foreground">{act.title}</h4>
                    {act.location && (
                      <p className="text-xs text-muted-foreground">{act.location}</p>
                    )}
                    {act.notes && (
                      <p className="text-xs text-foreground/50 mt-1">{act.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ItineraryTab = ({ days }: ItineraryTabProps) => {
  return (
    <div className="space-y-4 pb-20">
      {days.map((day) => (
        <ItineraryItem key={day.id} day={day} />
      ))}
    </div>
  );
};

export default ItineraryTab;
