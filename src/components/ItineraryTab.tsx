import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X, Hotel, Plane, UtensilsCrossed, Sparkles, Palmtree, Landmark, Bus, Camera, GripVertical, ImagePlus } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItineraryDay, ItineraryActivity, TransportItem, AccommodationItem, ActivityItem, ReservationItem } from '@/types/honeymoon';
import { parseDateString } from '@/lib/dateUtils';

interface ItineraryTabProps {
  days: ItineraryDay[];
  tripData?: { date: string; days: number; destination: string };
  transportItems?: TransportItem[];
  accommodationItems?: AccommodationItem[];
  activityItems?: ActivityItem[];
  reservationItems?: ReservationItem[];
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
  if (t.includes('check-out') || t.includes('check out')) return 'hotel';
  if (t.includes('flight') || t.includes('airport') || t.includes('fly')) return 'flight';
  if (t.includes('dinner') || t.includes('lunch') || t.includes('breakfast') || t.includes('restaurant') || t.includes('brunch')) return 'dining';
  if (t.includes('spa') || t.includes('massage') || t.includes('treatment')) return 'spa';
  if (t.includes('beach') || t.includes('pool') || t.includes('swim')) return 'beach';
  if (t.includes('tour') || t.includes('visit') || t.includes('explore') || t.includes('ruins') || t.includes('museum') || t.includes('archaeological')) return 'sightseeing';
  if (t.includes('ferry') || t.includes('transfer') || t.includes('taxi') || t.includes('drive')) return 'transport';
  if (t.includes('cruise') || t.includes('catamaran') || t.includes('sail')) return 'activity';
  if (t.includes('wine') || t.includes('tasting')) return 'activity';
  if (t.includes('stay at') || t.includes('staying')) return 'hotel';
  return 'activity';
};

const extractTime = (dateTimeStr: string): string => {
  const timeMatch = dateTimeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
  return timeMatch ? timeMatch[1] : '';
};

const extractDateForComparison = (dateStr: string, fallbackYear: number): Date | null => {
  const withoutTime = dateStr.replace(/,?\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)/i, '').trim();
  let parsed = parseDateString(withoutTime);
  if (parsed) return parsed;
  parsed = parseDateString(withoutTime, fallbackYear);
  if (parsed) return parsed;
  parsed = parseDateString(dateStr);
  if (parsed) return parsed;
  return parseDateString(dateStr, fallbackYear);
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const buildSyncedActivities = (
  dayDate: Date,
  transportItems: TransportItem[],
  accommodationItems: AccommodationItem[],
  activityItems: ActivityItem[],
  reservationItems: ReservationItem[],
  fallbackYear: number,
): ItineraryActivity[] => {
  const activities: ItineraryActivity[] = [];

  for (const t of transportItems) {
    if (!t.time || !t.type) continue;
    const itemDate = extractDateForComparison(t.time, fallbackYear);
    if (itemDate && isSameDay(itemDate, dayDate)) {
      activities.push({
        time: extractTime(t.time) || t.time,
        title: `${t.type}${t.details ? ': ' + t.details : ''}`,
        location: '',
        notes: t.confirmation ? `Confirmation: ${t.confirmation}` : '',
        iconType: t.type.toLowerCase().includes('flight') ? 'flight' : 'transport',
      });
    }
  }

  for (const a of accommodationItems) {
    if (!a.name) continue;
    const checkInDate = extractDateForComparison(a.checkIn, fallbackYear);
    const checkOutDate = extractDateForComparison(a.checkOut, fallbackYear);
    if (!checkInDate || !checkOutDate) continue;
    if (isSameDay(dayDate, checkInDate)) {
      activities.push({
        time: a.checkInTime || 'Check-in',
        title: `Check-in at ${a.name}`,
        location: a.address,
        notes: a.confirmation ? `Confirmation: ${a.confirmation}` : '',
        iconType: 'hotel',
      });
    } else if (isSameDay(dayDate, checkOutDate)) {
      activities.push({
        time: a.checkOutTime || 'Check-out',
        title: `Check-out from ${a.name}`,
        location: a.address,
        notes: '',
        iconType: 'hotel',
      });
    } else if (dayDate > checkInDate && dayDate < checkOutDate) {
      activities.push({
        time: '',
        title: `Stay at ${a.name}`,
        location: a.address,
        notes: '',
        iconType: 'hotel',
      });
    }
  }

  for (const act of activityItems) {
    if (!act.name || !act.time) continue;
    const itemDate = extractDateForComparison(act.time, fallbackYear);
    if (itemDate && isSameDay(itemDate, dayDate)) {
      activities.push({
        time: extractTime(act.time) || act.time,
        title: act.name,
        location: '',
        notes: [act.notes, act.confirmation ? `Confirmation: ${act.confirmation}` : ''].filter(Boolean).join(' · '),
        iconType: guessIconType(act.name),
      });
    }
  }

  for (const r of reservationItems) {
    if (!r.name) continue;
    const itemDate = extractDateForComparison(r.date, fallbackYear);
    if (itemDate && isSameDay(itemDate, dayDate)) {
      activities.push({
        time: r.time || '',
        title: r.name,
        location: '',
        notes: [r.notes, r.confirmation ? `Confirmation: ${r.confirmation}` : ''].filter(Boolean).join(' · '),
        iconType: 'dining',
      });
    }
  }

  activities.sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return activities;
};

/* ── Sortable Activity Card ── */
interface SortableActivityProps {
  activity: ItineraryActivity;
  id: string;
  isSynced: boolean;
  onUpdate: (fields: Partial<ItineraryActivity>) => void;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
}

const SortableActivityCard = ({ activity: act, id, isSynced, onUpdate, onImageUpload, onRemoveImage }: SortableActivityProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };
  const IconComponent = iconMap[act.iconType || 'default'] || iconMap.default;
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleBlur = (field: string, value: string) => {
    onUpdate({ [field]: value });
    setEditingField(null);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-3 sm:gap-4 items-start relative group/item">
      {/* Timeline node */}
      <div className="flex-shrink-0 z-10">
        {act.imageUrl ? (
          <div className="relative w-[62px] h-[62px] rounded-full overflow-hidden ring-2 ring-background shadow-soft">
            <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
            <button onClick={onRemoveImage} className="absolute -top-1 -right-1 w-5 h-5 bg-foreground/60 rounded-full flex items-center justify-center">
              <X size={10} className="text-background" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-[62px] h-[62px] rounded-full bg-card flex items-center justify-center border-2 border-primary/40 shadow-soft cursor-pointer hover:border-primary/60 transition-colors relative group/icon"
          >
            <IconComponent size={24} strokeWidth={1.8} className="text-primary-foreground group-hover/icon:opacity-0 transition-opacity" />
            <ImagePlus size={20} strokeWidth={1.5} className="text-primary-foreground/50 absolute opacity-0 group-hover/icon:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Content card */}
      <div className={`flex-1 min-w-0 bg-card rounded-l-2xl sm:rounded-2xl p-4 shadow-soft -mr-6 sm:mr-0 pr-12 sm:pr-12 relative ${isSynced ? 'border-l-2 border-primary/30' : ''}`}>
        {/* Time - editable */}
        {editingField === 'time' ? (
          <input
            autoFocus
            defaultValue={act.time}
            onBlur={(e) => handleBlur('time', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur('time', (e.target as HTMLInputElement).value)}
            className="text-[11px] font-medium text-foreground/50 tracking-wider uppercase block mb-1 bg-transparent border-b border-primary/40 focus:outline-none w-full"
          />
        ) : (
          <button onClick={() => setEditingField('time')} className="text-left w-full">
            <span className="text-[11px] font-medium text-foreground/50 tracking-wider uppercase block mb-1 hover:text-foreground/70 transition-colors">
              {act.time || 'Add time'}
            </span>
          </button>
        )}

        {/* Title - editable */}
        {editingField === 'title' ? (
          <input
            autoFocus
            defaultValue={act.title}
            onBlur={(e) => handleBlur('title', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur('title', (e.target as HTMLInputElement).value)}
            className="font-serif text-base text-foreground leading-snug bg-transparent border-b border-primary/40 focus:outline-none w-full"
          />
        ) : (
          <button onClick={() => setEditingField('title')} className="text-left w-full">
            <h4 className="font-serif text-base text-foreground leading-snug hover:text-foreground/70 transition-colors">{act.title}</h4>
          </button>
        )}

        {/* Location - editable */}
        {editingField === 'location' ? (
          <input
            autoFocus
            defaultValue={act.location}
            onBlur={(e) => handleBlur('location', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur('location', (e.target as HTMLInputElement).value)}
            className="text-xs text-muted-foreground mt-0.5 bg-transparent border-b border-primary/40 focus:outline-none w-full"
            placeholder="Add location"
          />
        ) : (
          <button onClick={() => setEditingField('location')} className="text-left w-full">
            <p className="text-xs text-muted-foreground mt-0.5 hover:text-foreground/50 transition-colors">
              {act.location || 'Add location'}
            </p>
          </button>
        )}

        {/* Notes - editable */}
        {editingField === 'notes' ? (
          <input
            autoFocus
            defaultValue={act.notes}
            onBlur={(e) => handleBlur('notes', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur('notes', (e.target as HTMLInputElement).value)}
            className="text-xs text-foreground/40 mt-1 bg-transparent border-b border-primary/40 focus:outline-none w-full"
            placeholder="Add notes"
          />
        ) : act.notes ? (
          <button onClick={() => setEditingField('notes')} className="text-left w-full">
            <p className="text-xs text-foreground/40 mt-1 hover:text-foreground/50 transition-colors">{act.notes}</p>
          </button>
        ) : (
          <button onClick={() => setEditingField('notes')} className="text-left">
            <p className="text-xs text-foreground/20 mt-1 hover:text-foreground/40 transition-colors">Add notes</p>
          </button>
        )}

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1"
        >
          <div className="grid grid-cols-2 gap-[3px]">
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/25" />
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/25" />
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/25" />
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/25" />
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImageUpload(file);
        }}
      />
    </div>
  );
};

/* ── Itinerary Day Item ── */
const ItineraryItem = ({ day: initialDay, syncedActivities }: { day: ItineraryDay; syncedActivities: ItineraryActivity[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualActivities, setManualActivities] = useState<ItineraryActivity[]>(() =>
    initialDay.activities.map(a => ({
      ...a,
      iconType: (a.iconType || guessIconType(a.title)) as ItineraryActivity['iconType'],
    }))
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const [destination, setDestination] = useState(initialDay.destination);

  // Merge synced + manual, deduplicate by title
  const allActivities = useMemo(() => {
    const syncedTitles = new Set(syncedActivities.map(a => a.title.toLowerCase()));
    const uniqueManual = manualActivities.filter(a => !syncedTitles.has(a.title.toLowerCase()));
    const merged = [...syncedActivities, ...uniqueManual];
    merged.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    return merged;
  }, [syncedActivities, manualActivities]);

  // Generate stable IDs for dnd-kit
  const activityIds = useMemo(() => allActivities.map((_, i) => `act-${i}`), [allActivities]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activityIds.indexOf(active.id);
    const newIndex = activityIds.indexOf(over.id);
    // Only reorder manual activities
    const syncCount = syncedActivities.length;
    const oldManualIdx = oldIndex - syncCount;
    const newManualIdx = newIndex - syncCount;
    if (oldManualIdx >= 0 && newManualIdx >= 0) {
      setManualActivities(prev => arrayMove(prev, oldManualIdx, newManualIdx));
    }
  }, [activityIds, syncedActivities.length]);

  const updateActivity = useCallback((index: number, fields: Partial<ItineraryActivity>) => {
    const manualIdx = index - syncedActivities.length;
    if (manualIdx < 0) return;
    setManualActivities(prev => {
      const updated = [...prev];
      updated[manualIdx] = { ...updated[manualIdx], ...fields };
      if (fields.title) {
        updated[manualIdx].iconType = guessIconType(fields.title);
      }
      return updated;
    });
  }, [syncedActivities.length]);

  const handleImageUpload = useCallback((index: number, file: File) => {
    const url = URL.createObjectURL(file);
    const manualIdx = index - syncedActivities.length;
    if (manualIdx >= 0) {
      setManualActivities(prev => {
        const updated = [...prev];
        updated[manualIdx] = { ...updated[manualIdx], imageUrl: url };
        return updated;
      });
    }
  }, [syncedActivities.length]);

  const removeImage = useCallback((index: number) => {
    const manualIdx = index - syncedActivities.length;
    if (manualIdx >= 0) {
      setManualActivities(prev => {
        const updated = [...prev];
        updated[manualIdx] = { ...updated[manualIdx], imageUrl: undefined };
        return updated;
      });
    }
  }, [syncedActivities.length]);

  const addActivity = () => {
    const newAct: ItineraryActivity = { time: '', title: 'New Activity', location: '', notes: '', iconType: 'activity' };
    setManualActivities(prev => [...prev, newAct]);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div>
      <motion.button
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-5 bg-primary rounded-2xl shadow-arch transition-shadow hover:shadow-lift"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="font-serif text-lg text-primary-foreground whitespace-nowrap">{initialDay.dayLabel}</span>
          <span className="text-primary-foreground/25">|</span>
          <span className="font-serif text-sm text-primary-foreground/50 whitespace-nowrap">{initialDay.date}</span>
          <span className="text-primary-foreground/25">|</span>
          <span className="font-serif text-primary-foreground/65 truncate">{destination}</span>
        </div>
        <div className="flex items-center gap-2">
          {allActivities.length > 0 && (
            <span className="text-xs text-primary-foreground/40 font-body">{allActivities.length}</span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} className="text-primary-foreground/60" />
          </motion.div>
        </div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Editable destination - hover to edit, no helper text */}
            <div className="pt-5 pb-2 px-2">
              {editingTitle ? (
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                  autoFocus
                  className="font-serif text-lg text-foreground bg-transparent border-b border-primary focus:outline-none w-full"
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-left w-full group/dest"
                >
                  <span className="font-serif text-lg text-foreground/70 group-hover/dest:text-foreground transition-colors">
                    {destination}
                  </span>
                </button>
              )}
            </div>

            {/* Timeline */}
            <div className="py-4 relative">
              {allActivities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic px-2">No activities planned yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[31px] top-4 bottom-4 w-[2.5px] bg-primary/60" />
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {allActivities.map((act, i) => {
                          const isSynced = i < syncedActivities.length;
                          return (
                            <SortableActivityCard
                              key={activityIds[i]}
                              id={activityIds[i]}
                              activity={act}
                              isSynced={isSynced}
                              onUpdate={(fields) => updateActivity(i, fields)}
                              onImageUpload={(file) => handleImageUpload(i, file)}
                              onRemoveImage={() => removeImage(i)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
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

const generateDaysFromTrip = (tripData: { date: string; days: number; destination: string }): ItineraryDay[] => {
  const startDate = parseDateString(tripData.date);
  if (!startDate) return [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return Array.from({ length: tripData.days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return {
      id: String(i + 1),
      dayLabel: `Day ${i + 1}`,
      date: `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`,
      destination: tripData.destination,
      activities: [],
    };
  });
};

const ItineraryTab = ({ days, tripData, transportItems = [], accommodationItems = [], activityItems = [], reservationItems = [] }: ItineraryTabProps) => {
  const displayDays = tripData ? generateDaysFromTrip(tripData) : days;
  const startDate = tripData ? parseDateString(tripData.date) : null;
  const fallbackYear = startDate ? startDate.getFullYear() : new Date().getFullYear();

  return (
    <div className="space-y-4 pb-20">
      {displayDays.map((day, i) => {
        let dayDate: Date | null = null;
        if (startDate) {
          dayDate = new Date(startDate);
          dayDate.setDate(dayDate.getDate() + i);
        }
        const syncedActivities = dayDate
          ? buildSyncedActivities(dayDate, transportItems, accommodationItems, activityItems, reservationItems, fallbackYear)
          : [];
        return (
          <ItineraryItem key={day.id} day={day} syncedActivities={syncedActivities} />
        );
      })}
    </div>
  );
};

export default ItineraryTab;
