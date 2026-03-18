import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Image as ImageIcon, X } from 'lucide-react';
import type { ItineraryDay, ItineraryActivity } from '@/types/honeymoon';

interface ItineraryTabProps {
  days: ItineraryDay[];
}

const ItineraryItem = ({ day: initialDay }: { day: ItineraryDay }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState(initialDay);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDest, setTitleDest] = useState(day.destination);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleImageUpload = (activityIndex: number, file: File) => {
    const url = URL.createObjectURL(file);
    const updated = { ...day };
    updated.activities = [...updated.activities];
    updated.activities[activityIndex] = { ...updated.activities[activityIndex], imageUrl: url };
    setDay(updated);
  };

  const removeImage = (activityIndex: number) => {
    const updated = { ...day };
    updated.activities = [...updated.activities];
    updated.activities[activityIndex] = { ...updated.activities[activityIndex], imageUrl: undefined };
    setDay(updated);
  };

  const addActivity = () => {
    const newAct: ItineraryActivity = { time: '12:00 PM', title: 'New Activity', location: '', notes: '' };
    setDay({ ...day, activities: [...day.activities, newAct] });
  };

  return (
    <div>
      <motion.button
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 bg-primary pill-shape shadow-arch transition-shadow hover:shadow-lift"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="font-serif text-lg text-primary-foreground whitespace-nowrap">{day.dayLabel}</span>
          <span className="text-primary-foreground/25">|</span>
          <span className="font-serif text-sm text-primary-foreground/50 whitespace-nowrap">{day.date}</span>
          <span className="text-primary-foreground/25">|</span>
          <span className="font-serif text-primary-foreground/65 truncate">{day.destination}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-primary-foreground/60" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden px-6"
          >
            {/* Editable destination */}
            <div className="pt-5 pb-2">
              {editingTitle ? (
                <input
                  value={titleDest}
                  onChange={(e) => setTitleDest(e.target.value)}
                  onBlur={() => {
                    setDay({ ...day, destination: titleDest });
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (setDay({ ...day, destination: titleDest }), setEditingTitle(false))}
                  autoFocus
                  className="font-serif text-lg text-foreground bg-transparent border-b border-primary focus:outline-none w-full"
                />
              ) : (
                <button onClick={() => setEditingTitle(true)} className="text-left w-full">
                  <span className="font-serif text-lg text-foreground/70 hover:text-foreground transition-colors">
                    {day.destination}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">tap to edit</span>
                </button>
              )}
            </div>

            <div className="py-4 space-y-5 border-l-2 border-primary/40 ml-4 pl-6">
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
                      <p className="text-xs text-foreground/40 mt-1">{act.notes}</p>
                    )}

                    {/* Image */}
                    {act.imageUrl ? (
                      <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden">
                        <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 w-6 h-6 bg-foreground/60 rounded-full flex items-center justify-center"
                        >
                          <X size={12} className="text-card" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[i]?.click()}
                        className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ImageIcon size={12} strokeWidth={1.5} />
                        <span>Add photo</span>
                      </button>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[i] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(i, file);
                      }}
                    />
                  </div>
                ))
              )}
            </div>

            <button
              onClick={addActivity}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <Plus size={14} strokeWidth={1.5} />
              <span className="font-body">Add activity</span>
            </button>
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
