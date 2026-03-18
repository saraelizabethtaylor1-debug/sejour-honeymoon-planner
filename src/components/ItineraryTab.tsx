import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X, ArrowUp, ArrowDown, Hotel, Plane, UtensilsCrossed, Sparkles, Palmtree, Landmark, Bus, Camera } from 'lucide-react';
import type { ItineraryDay, ItineraryActivity } from '@/types/honeymoon';

interface ItineraryTabProps {
  days: ItineraryDay[];
}

const iconMap: Record<string, typeof Hotel> = {
  hotel: Hotel,
  flight: Plane,
  dining: UtensilsCrossed,
  activity: Sparkles,
  spa: Sparkles,
  beach: Palmtree,
  sightseeing: Landmark,
  transport: Bus,
  default: Camera,
};

const guessIconType = (title: string): ItineraryActivity['iconType'] => {
  const t = title.toLowerCase();
  if (t.includes('check-in') || t.includes('check in') || t.includes('hotel') || t.includes('suite') || t.includes('resort')) return 'hotel';
  if (t.includes('flight') || t.includes('airport') || t.includes('fly')) return 'flight';
  if (t.includes('dinner') || t.includes('lunch') || t.includes('breakfast') || t.includes('restaurant') || t.includes('brunch')) return 'dining';
  if (t.includes('spa') || t.includes('massage') || t.includes('treatment')) return 'spa';
  if (t.includes('beach') || t.includes('pool') || t.includes('swim')) return 'beach';
  if (t.includes('tour') || t.includes('visit') || t.includes('explore') || t.includes('ruins') || t.includes('museum') || t.includes('archaeological')) return 'sightseeing';
  if (t.includes('ferry') || t.includes('transfer') || t.includes('taxi') || t.includes('drive')) return 'transport';
  if (t.includes('cruise') || t.includes('catamaran') || t.includes('sail')) return 'activity';
  if (t.includes('wine') || t.includes('tasting')) return 'activity';
  return 'activity';
};

const ItineraryItem = ({ day: initialDay }: { day: ItineraryDay }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState<ItineraryDay>(() => ({
    ...initialDay,
    activities: initialDay.activities.map(a => ({
      ...a,
      iconType: (a.iconType || guessIconType(a.title)) as ItineraryActivity['iconType'],
    })),
  }));
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
    const newAct: ItineraryActivity = { time: '12:00 PM', title: 'New Activity', location: '', notes: '', iconType: 'activity' };
    setDay({ ...day, activities: [...day.activities, newAct] });
  };

  const moveActivity = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= day.activities.length) return;
    const newActivities = [...day.activities];
    [newActivities[index], newActivities[newIndex]] = [newActivities[newIndex], newActivities[index]];
    setDay({ ...day, activities: newActivities });
  };

  const cycleIcon = (activityIndex: number) => {
    const types: ItineraryActivity['iconType'][] = ['hotel', 'flight', 'dining', 'activity', 'spa', 'beach', 'sightseeing', 'transport', 'default'];
    const current = day.activities[activityIndex].iconType || 'default';
    const currentIdx = types.indexOf(current);
    const next = types[(currentIdx + 1) % types.length];
    const updated = { ...day };
    updated.activities = [...updated.activities];
    updated.activities[activityIndex] = { ...updated.activities[activityIndex], iconType: next };
    setDay(updated);
  };

  return (
    <div>
      <motion.button
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 bg-primary rounded-2xl shadow-arch transition-shadow hover:shadow-lift"
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
            className="overflow-hidden px-4"
          >
            {/* Editable destination */}
            <div className="pt-5 pb-2 px-2">
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

            {/* Timeline */}
            <div className="py-4 relative">
              {day.activities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic px-2">No activities planned yet</p>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[31px] top-4 bottom-4 w-[2px] bg-primary/40" />

                  <div className="space-y-3">
                    {day.activities.map((act, i) => {
                      const IconComponent = iconMap[act.iconType || 'default'] || iconMap.default;
                      return (
                        <div key={i} className="flex gap-4 items-start relative">
                          {/* Left: Timeline node - Photo or Icon */}
                          <div className="flex-shrink-0 z-10">
                            {act.imageUrl ? (
                              <div className="relative w-[62px] h-[62px] rounded-full overflow-hidden ring-2 ring-background shadow-soft">
                                <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removeImage(i)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-foreground/60 rounded-full flex items-center justify-center"
                                >
                                  <X size={10} className="text-background" />
                                </button>
                                {/* Click image to change it */}
                                <button
                                  onClick={() => fileInputRefs.current[i]?.click()}
                                  className="absolute inset-0 bg-foreground/0 hover:bg-foreground/20 transition-colors rounded-full"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => fileInputRefs.current[i]?.click()}
                                onContextMenu={(e) => { e.preventDefault(); cycleIcon(i); }}
                                className="w-[62px] h-[62px] rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors ring-2 ring-background shadow-soft cursor-pointer"
                                title="Click to upload photo, right-click to change icon"
                              >
                                <IconComponent size={22} strokeWidth={1.5} className="text-primary/50" />
                              </button>
                            )}
                          </div>

                          {/* Right: Content */}
                          <div className="flex-1 min-w-0 bg-card rounded-2xl p-4 shadow-soft">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase whitespace-nowrap">{act.time}</span>
                              <span className="text-muted-foreground/30">|</span>
                              <h4 className="font-serif text-base text-foreground leading-snug truncate">{act.title}</h4>
                            </div>
                            {act.location && (
                              <p className="text-xs text-muted-foreground mt-0.5">{act.location}</p>
                            )}
                            {act.notes && (
                              <p className="text-xs text-foreground/40 mt-1">{act.notes}</p>
                            )}
                          </div>

                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-1 flex-shrink-0 pt-3">
                            <button
                              onClick={() => moveActivity(i, 'up')}
                              disabled={i === 0}
                              className="p-1 text-foreground/20 hover:text-foreground/60 disabled:opacity-20 transition-colors"
                            >
                              <ArrowUp size={14} strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => moveActivity(i, 'down')}
                              disabled={i === day.activities.length - 1}
                              className="p-1 text-foreground/20 hover:text-foreground/60 disabled:opacity-20 transition-colors"
                            >
                              <ArrowDown size={14} strokeWidth={1.5} />
                            </button>
                          </div>

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
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={addActivity}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 px-2"
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
