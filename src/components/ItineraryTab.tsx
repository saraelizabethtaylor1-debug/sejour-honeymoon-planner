import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X, Bed, Plane, UtensilsCrossed, Sparkles, Palmtree, Landmark, Bus, Camera, ImagePlus } from 'lucide-react';
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
}

const iconMap: Record<string, typeof Bed> = {
  hotel: Bed,
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

interface TaggedActivity extends ItineraryActivity {
  _uid: string;
  _synced: boolean;
}

let uidCounter = 0;
const nextUid = () => `itact-${++uidCounter}-${Date.now()}`;

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
      activities.push({
        _uid: `sync-transport-${t.id}`,
        _synced: true,
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
        _uid: `sync-acc-checkin-${a.id}`,
        _synced: true,
        time: a.checkInTime || 'Check-in',
        title: `Check-in at ${a.name}`,
        location: a.address,
        notes: a.confirmation ? `Confirmation: ${a.confirmation}` : '',
        iconType: 'hotel',
      });
    } else if (isSameDay(dayDate, checkOutDate)) {
      activities.push({
        _uid: `sync-acc-checkout-${a.id}`,
        _synced: true,
        time: a.checkOutTime || 'Check-out',
        title: `Check-out from ${a.name}`,
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
        _uid: `sync-reservation-${r.id}`,
        _synced: true,
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
  activity: TaggedActivity;
  id: string;
  onUpdate: (fields: Partial<ItineraryActivity>) => void;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
}

const SortableActivityCard = ({ activity: act, id, onUpdate, onImageUpload, onRemoveImage }: SortableActivityProps) => {
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
      <div className={`flex-1 min-w-0 bg-card rounded-l-2xl sm:rounded-2xl p-4 shadow-soft -mr-6 sm:mr-0 pr-12 sm:pr-12 relative ${act._synced ? 'border-l-2 border-primary/30' : ''}`}>
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
              {act.time || 'Add time'}
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
            className="font-serif text-base text-foreground leading-snug bg-transparent border-b border-primary/40 focus:outline-none w-full"
          />
        ) : (
          <button onClick={() => setEditingField('title')} className="text-left w-full">
            <h4 className="font-serif text-base text-foreground leading-snug hover:text-foreground/70 transition-colors">{act.title}</h4>
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

        {/* Notes */}
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

        {/* Drag handle — always rendered, visible on hover */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 touch-none"
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
const ItineraryItem = ({
  day: initialDay,
  syncedActivities,
  dayDateStr,
  onAddActivity,
}: {
  day: ItineraryDay;
  syncedActivities: TaggedActivity[];
  dayDateStr: string;
  onAddActivity?: (activity: ActivityItem) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [destination, setDestination] = useState(initialDay.destination);

  // Maintain a single ordered list of all activities with stable UIDs
  const [orderedActivities, setOrderedActivities] = useState<TaggedActivity[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Build initial list from synced + manual (from initialDay.activities)
  useEffect(() => {
    const manualTagged: TaggedActivity[] = initialDay.activities.map(a => ({
      ...a,
      _uid: nextUid(),
      _synced: false,
      iconType: (a.iconType || guessIconType(a.title)) as ItineraryActivity['iconType'],
    }));

    // Merge: synced first, then manual, sorted by time initially
    const merged = [...syncedActivities, ...manualTagged];
    merged.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    setOrderedActivities(merged);
    setInitialized(true);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update synced activities when they change (external data), preserving manual order
  useEffect(() => {
    if (!initialized) return;
    setOrderedActivities(prev => {
      const manualItems = prev.filter(a => !a._synced);
      const merged = [...syncedActivities, ...manualItems];
      // Don't re-sort — keep synced sorted, manual at end in their order
      return merged;
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

    // Also add to activities list for Trip Overview
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
          {orderedActivities.length > 0 && (
            <span className="text-xs text-primary-foreground/40 font-body">{orderedActivities.length}</span>
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
            {/* Editable destination */}
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
              {orderedActivities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic px-2">No activities planned yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[31px] top-4 bottom-4 w-[2.5px] bg-primary/60" />
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {orderedActivities.map((act) => (
                          <SortableActivityCard
                            key={act._uid}
                            id={act._uid}
                            activity={act}
                            onUpdate={(fields) => updateActivity(act._uid, fields)}
                            onImageUpload={(file) => handleImageUpload(act._uid, file)}
                            onRemoveImage={() => removeImage(act._uid)}
                          />
                        ))}
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

const formatDayDate = (tripData: { date: string; days: number }, dayIndex: number): string => {
  const startDate = parseDateString(tripData.date);
  if (!startDate) return '';
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayIndex);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const ItineraryTab = ({ days, tripData, transportItems = [], accommodationItems = [], activityItems = [], reservationItems = [], onAddActivity }: ItineraryTabProps) => {
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
        const dayDateStr = tripData ? formatDayDate(tripData, i) : '';
        return (
          <ItineraryItem
            key={day.id}
            day={day}
            syncedActivities={syncedActivities}
            dayDateStr={dayDateStr}
            onAddActivity={onAddActivity}
          />
        );
      })}
    </div>
  );
};

export default ItineraryTab;
