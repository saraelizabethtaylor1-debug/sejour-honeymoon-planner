import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X, Bed, Plane, UtensilsCrossed, Sparkles, Palmtree, Landmark, Bus, Camera, ImagePlus, Trash2, ExternalLink, Ship, TrainFront, Car } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
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
  onAddActivity?: (activity: ActivityItem) => void;
  onRemoveActivity?: (id: string) => void;
}

const iconMap: Record<string, typeof Bed> = {
  hotel: Bed,
  flight: Plane,
  ferry: Ship,
  train: TrainFront,
  car: Car,
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

interface TaggedActivity extends ItineraryActivity {
  _uid: string;
  _synced: boolean;
}

let uidCounter = 0;
const nextUid = () => `itact-${++uidCounter}-${Date.now()}`;

const numberToWord = (n: number): string => {
  const words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
    'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five', 'Twenty-Six', 'Twenty-Seven', 'Twenty-Eight', 'Twenty-Nine', 'Thirty', 'Thirty-One'];
  return words[n - 1] || String(n);
};

const buildSyncedActivities = (
  dayDate: Date,
  transportItems: TransportItem[],
  accommodationItems: AccommodationItem[],
  activityItems: ActivityItem[],
  reservationItems: ReservationItem[],
  fallbackYear: number,
): TaggedActivity[] => {
  const activities: TaggedActivity[] = [];

  for (const t of transportItems) {
    if (!t.time || !t.type) continue;
    const itemDate = extractDateForComparison(t.time, fallbackYear);
    if (itemDate && isSameDay(itemDate, dayDate)) {
      const locationParts = [t.departureLocation, t.arrivalLocation].filter(Boolean);
      const locationStr = locationParts.length === 2 ? `${locationParts[0]} → ${locationParts[1]}` : locationParts[0] || '';
      const typeLC = t.type.toLowerCase();
      const iconKey = typeLC === 'plane' ? 'flight' : typeLC === 'ferry' ? 'ferry' : typeLC === 'train' ? 'train' : typeLC === 'car' ? 'car' : 'transport';
      activities.push({
        _uid: `sync-transport-${t.id}`,
        _synced: true,
        time: extractTime(t.time) || t.time,
        title: `${t.type}${t.details ? ': ' + t.details : ''}`,
        location: locationStr,
        notes: t.confirmation ? `Confirmation: ${t.confirmation}` : '',
        iconType: iconKey as ItineraryActivity['iconType'],
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
        _uid: `sync-acc-checkin-${a.id}`,
        _synced: true,
        time: a.checkInTime || '',
        title: `Check in at ${a.name}${a.checkInTime ? ' • ' + a.checkInTime : ''}`,
        location: a.address,
        notes: a.confirmation ? `Confirmation: ${a.confirmation}` : '',
        iconType: 'hotel',
      });
    } else if (isSameDay(dayDate, checkOutDate)) {
      activities.push({
        _uid: `sync-acc-checkout-${a.id}`,
        _synced: true,
        time: a.checkOutTime || '',
        title: `Check out at ${a.name}${a.checkOutTime ? ' • ' + a.checkOutTime : ''}`,
        location: a.address,
        notes: '',
        iconType: 'hotel',
      });
    } else if (dayDate > checkInDate && dayDate < checkOutDate) {
      activities.push({
        _uid: `sync-acc-stay-${a.id}`,
        _synced: true,
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
        _uid: `sync-activity-${act.id}`,
        _synced: true,
        time: extractTime(act.time) || act.time,
        title: act.name,
        location: act.location || '',
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
        _uid: `sync-reservation-${r.id}`,
        _synced: true,
        time: r.time || '',
        title: r.name,
        location: r.location || '',
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

/* ── Sortable Activity Card (new layout) ── */
interface SortableActivityProps {
  activity: TaggedActivity;
  id: string;
  onUpdate: (fields: Partial<ItineraryActivity>) => void;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
  onDelete: () => void;
}

const SortableActivityCard = ({ activity: act, id, onUpdate, onImageUpload, onRemoveImage, onDelete }: SortableActivityProps) => {
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
    <div ref={setNodeRef} style={style} className="flex items-start relative group/item">
      {/* Timeline dot */}
      <div className="flex-shrink-0 w-8 flex justify-center pt-6 relative z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-primary/40 border-2 border-primary/60" />
      </div>

      {/* Card */}
      <div className="flex-1 bg-card rounded-2xl shadow-soft flex gap-3 sm:gap-4 min-w-0 overflow-hidden">
        <div className="flex-1 flex gap-3 sm:gap-4 min-w-0 p-4 sm:p-5">
        {/* Drag handle - 2x2 dot grid */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none pt-1"
        >
          <div className="grid grid-cols-2 gap-[3px]">
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
            <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
          </div>
        </div>

        {/* Category icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <IconComponent size={18} strokeWidth={1.4} className="text-primary-foreground" />
          </div>
        </div>

        {/* Content block */}
        <div className="flex-1 min-w-0">
          {/* Time */}
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
                {act.time ? act.time.replace(/^.*?,\s*/, '') : 'Add time'}
              </span>
            </button>
          )}

          {/* Title */}
          {editingField === 'title' ? (
            <input
              autoFocus
              defaultValue={act.title}
              onBlur={(e) => handleBlur('title', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur('title', (e.target as HTMLInputElement).value)}
              className="font-serif text-base font-semibold text-foreground leading-snug bg-transparent border-b border-primary/40 focus:outline-none w-full"
            />
          ) : (
            <button onClick={() => setEditingField('title')} className="text-left w-full">
              <h4 className="font-serif text-base font-semibold text-foreground leading-snug hover:text-foreground/70 transition-colors">{act.title}</h4>
            </button>
          )}

          {/* Location */}
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

          {/* Divider */}
          <div className="border-t border-foreground/10 my-2.5" />

          {/* Notes */}
          {editingField === 'notes' ? (
            <input
              autoFocus
              defaultValue={act.notes}
              onBlur={(e) => handleBlur('notes', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur('notes', (e.target as HTMLInputElement).value)}
              className="text-xs text-foreground/50 bg-transparent border-b border-primary/40 focus:outline-none w-full"
              placeholder="Add notes"
            />
          ) : act.notes ? (
            <button onClick={() => setEditingField('notes')} className="text-left w-full">
              <p className="text-xs text-foreground/50 hover:text-foreground/60 transition-colors">{act.notes}</p>
            </button>
          ) : (
            <button onClick={() => setEditingField('notes')} className="text-left">
              <p className="text-xs text-foreground/20 hover:text-foreground/40 transition-colors">Add notes</p>
            </button>
          )}

          {/* View on map link */}
          {(act.location) && (
            <button className="flex items-center gap-1 mt-2.5 text-xs text-primary-foreground hover:text-primary-foreground/70 transition-colors">
              <span>View on map</span>
              <ExternalLink size={10} strokeWidth={1.5} />
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={onDelete}
            className="absolute top-3 right-3 p-1.5 hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
          >
            <Trash2 size={13} strokeWidth={1.3} className="text-foreground/30 hover:text-destructive transition-colors" />
          </button>
        </div>
        </div>

        {/* Photo placeholder - full height */}
        <div className="flex-shrink-0 w-20 sm:w-24">
          {act.imageUrl ? (
            <div className="relative w-full h-full">
              <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
              <button onClick={onRemoveImage} className="absolute top-1 right-1 w-5 h-5 bg-foreground/60 rounded-full flex items-center justify-center">
                <X size={10} className="text-background" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-full min-h-[80px] bg-primary/5 border-l border-primary/15 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <Plus size={14} strokeWidth={1.2} className="text-foreground/30" />
              <span className="text-[10px] text-foreground/30">photo</span>
            </button>
          )}
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
const ItineraryItem = ({
  day: initialDay,
  syncedActivities,
  dayDateStr,
  dayNumber,
  onAddActivity,
  onRemoveActivity,
}: {
  day: ItineraryDay;
  syncedActivities: TaggedActivity[];
  dayDateStr: string;
  dayNumber: number;
  onAddActivity?: (activity: ActivityItem) => void;
  onRemoveActivity?: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState(initialDay.destination);

  const [orderedActivities, setOrderedActivities] = useState<TaggedActivity[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const manualTagged: TaggedActivity[] = initialDay.activities.map(a => ({
      ...a,
      _uid: nextUid(),
      _synced: false,
      iconType: (a.iconType || guessIconType(a.title)) as ItineraryActivity['iconType'],
    }));
    const merged = [...syncedActivities, ...manualTagged];
    merged.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    setOrderedActivities(merged);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialized) return;
    setOrderedActivities(prev => {
      const manualItems = prev.filter(a => !a._synced);
      const manualIds = new Set(manualItems.map(a => a._uid));
      const filteredSynced = syncedActivities.filter(s => {
        const sourceId = s._uid.replace('sync-activity-', '');
        return !manualIds.has(sourceId);
      });
      return [...filteredSynced, ...manualItems];
    });
  }, [syncedActivities, initialized]);

  const activityIds = useMemo(() => orderedActivities.map(a => a._uid), [orderedActivities]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedActivities(prev => {
      const oldIndex = prev.findIndex(a => a._uid === active.id);
      const newIndex = prev.findIndex(a => a._uid === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const updateActivity = useCallback((uid: string, fields: Partial<ItineraryActivity>) => {
    setOrderedActivities(prev =>
      prev.map(a => {
        if (a._uid !== uid) return a;
        const updated = { ...a, ...fields };
        if (fields.title) updated.iconType = guessIconType(fields.title);
        return updated;
      })
    );
  }, []);

  const handleImageUpload = useCallback((uid: string, file: File) => {
    const url = URL.createObjectURL(file);
    setOrderedActivities(prev =>
      prev.map(a => a._uid === uid ? { ...a, imageUrl: url } : a)
    );
  }, []);

  const removeImage = useCallback((uid: string) => {
    setOrderedActivities(prev =>
      prev.map(a => a._uid === uid ? { ...a, imageUrl: undefined } : a)
    );
  }, []);

  const deleteActivity = useCallback((uid: string) => {
    setOrderedActivities(prev => prev.filter(a => a._uid !== uid));
    if (uid.startsWith('sync-activity-')) {
      const actId = uid.replace('sync-activity-', '');
      onRemoveActivity?.(actId);
    }
    if (uid.startsWith('itact-')) {
      onRemoveActivity?.(uid);
    }
  }, [onRemoveActivity]);

  const addActivity = () => {
    const newUid = nextUid();
    const newAct: TaggedActivity = {
      _uid: newUid,
      _synced: false,
      time: '',
      title: 'New Activity',
      location: '',
      notes: '',
      iconType: 'activity',
    };
    setOrderedActivities(prev => [...prev, newAct]);
    if (!isOpen) setIsOpen(true);

    if (onAddActivity) {
      const newActivityItem: ActivityItem = {
        id: newUid,
        name: 'New Activity',
        notes: '',
        time: dayDateStr,
        confirmation: '',
        cost: 0,
      };
      onAddActivity(newActivityItem);
    }
  };

  const paddedNumber = String(dayNumber).padStart(2, '0');
  const dayWord = numberToWord(dayNumber).toUpperCase();

  return (
    <div>
      {/* Day accordion header - pill shape */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 sm:px-6 py-4 bg-primary/30 rounded-full transition-shadow hover:bg-primary/40"
      >
        <div className="flex items-center gap-4">
          {/* Large day number */}
          <span className="font-serif text-3xl sm:text-4xl font-light text-primary-foreground/70 leading-none" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
            {paddedNumber}
          </span>
          {/* Stacked day label + date */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-primary-foreground/50">
              Day {dayWord}
            </span>
            <span className="font-serif text-sm sm:text-base text-primary-foreground/80 leading-snug">
              {initialDay.date} · {destination}
            </span>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-primary-foreground/50" />
        </motion.div>
      </motion.button>

      {/* Expanded body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Timeline area */}
            <div className="pt-6 pb-2 relative">
              {orderedActivities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic px-10 py-4">No activities planned yet</p>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[15px] top-6 bottom-0 w-[1.5px] bg-primary/20" />

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {orderedActivities.map((act) => (
                          <SortableActivityCard
                            key={act._uid}
                            id={act._uid}
                            activity={act}
                            onUpdate={(fields) => updateActivity(act._uid, fields)}
                            onImageUpload={(file) => handleImageUpload(act._uid, file)}
                            onRemoveImage={() => removeImage(act._uid)}
                            onDelete={() => deleteActivity(act._uid)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>

            {/* Add activity button - always visible, centered */}
            <div className="py-4">
              <button
                onClick={addActivity}
                className="w-full py-3 font-serif text-sm sm:text-base text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                + add activity
              </button>
            </div>
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

const formatDayDate = (tripData: { date: string; days: number }, dayIndex: number): string => {
  const startDate = parseDateString(tripData.date);
  if (!startDate) return '';
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayIndex);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const ItineraryTab = ({ days, tripData, transportItems = [], accommodationItems = [], activityItems = [], reservationItems = [], onAddActivity, onRemoveActivity }: ItineraryTabProps) => {
  const displayDays = tripData ? generateDaysFromTrip(tripData) : days;
  const startDate = tripData ? parseDateString(tripData.date) : null;
  const fallbackYear = startDate ? startDate.getFullYear() : new Date().getFullYear();

  return (
    <div className="w-full">
      <div className="max-w-[1300px] mx-auto px-6 space-y-1 pb-20">
      {displayDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-serif text-lg mb-2 text-primary-foreground">No itinerary yet</p>
          <p className="text-sm text-muted-foreground">Enter your trip dates on the welcome screen to generate your itinerary days.</p>
        </div>
      ) : (
        displayDays.map((day, i) => {
          let dayDate: Date | null = null;
          if (startDate) {
            dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + i);
          }
          const syncedActivities = dayDate
            ? buildSyncedActivities(dayDate, transportItems, accommodationItems, activityItems, reservationItems, fallbackYear)
            : [];
          const dayDateStr = tripData ? formatDayDate(tripData, i) : '';
          return (
            <ItineraryItem
              key={day.id}
              day={day}
              syncedActivities={syncedActivities}
              dayDateStr={dayDateStr}
              dayNumber={i + 1}
              onAddActivity={onAddActivity}
              onRemoveActivity={onRemoveActivity}
            />
          );
        })
      )}
      </div>
    </div>
  );
};

export default ItineraryTab;
