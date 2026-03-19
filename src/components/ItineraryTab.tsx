import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X, ArrowUp, ArrowDown, Hotel, Plane, UtensilsCrossed, Sparkles, Palmtree, Landmark, Bus, Camera } from 'lucide-react';
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

/** Extract time portion from a datetime string like "Sept 16, 4:00 PM" → "4:00 PM" */
const extractTime = (dateTimeStr: string): string => {
  const timeMatch = dateTimeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
  return timeMatch ? timeMatch[1] : '';
};

/** Extract date portion and parse to midnight Date for comparison */
const extractDateForComparison = (dateStr: string, fallbackYear: number): Date | null => {
  // Remove time portion first: "Sept 14, 10:30 PM" → "Sept 14"
  const withoutTime = dateStr.replace(/,?\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)/i, '').trim();
  // Try with year present
  let parsed = parseDateString(withoutTime);
  if (parsed) return parsed;
  // Use fallback year from trip data
  parsed = parseDateString(withoutTime, fallbackYear);
  if (parsed) return parsed;
  // Try original string (might have year)
  parsed = parseDateString(dateStr);
  if (parsed) return parsed;
  return parseDateString(dateStr, fallbackYear);
};

const isSameDay = (a: Date, b: Date): boolean => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

/** Build synced activities for a given itinerary day from overview data */
const buildSyncedActivities = (
  dayDate: Date,
  transportItems: TransportItem[],
  accommodationItems: AccommodationItem[],
  activityItems: ActivityItem[],
  reservationItems: ReservationItem[],
  fallbackYear: number,
): ItineraryActivity[] => {
  const activities: ItineraryActivity[] = [];

  // Transportation
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

  // Accommodations - span across days
  for (const a of accommodationItems) {
    if (!a.name) continue;
    const checkInDate = extractDateForComparison(a.checkIn);
    const checkOutDate = extractDateForComparison(a.checkOut);
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

  // Activities
  for (const act of activityItems) {
    if (!act.name || !act.time) continue;
    const itemDate = extractDateForComparison(act.time);
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

  // Reservations
  for (const r of reservationItems) {
    if (!r.name) continue;
    const itemDate = extractDateForComparison(r.date);
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

  // Sort by time
  activities.sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return activities;
};

const ItineraryItem = ({ day: initialDay, syncedActivities }: { day: ItineraryDay; syncedActivities: ItineraryActivity[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualActivities, setManualActivities] = useState<ItineraryActivity[]>(() =>
    initialDay.activities.map(a => ({
      ...a,
      iconType: (a.iconType || guessIconType(a.title)) as ItineraryActivity['iconType'],
    }))
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDest, setTitleDest] = useState(initialDay.destination);
  const [destination, setDestination] = useState(initialDay.destination);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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

  const handleImageUpload = (activityIndex: number, file: File) => {
    const url = URL.createObjectURL(file);
    // Only allow image upload on manual activities
    const manualIdx = activityIndex - syncedActivities.length;
    if (manualIdx >= 0 && manualIdx < manualActivities.length) {
      const updated = [...manualActivities];
      updated[manualIdx] = { ...updated[manualIdx], imageUrl: url };
      setManualActivities(updated);
    }
  };

  const removeImage = (activityIndex: number) => {
    const manualIdx = activityIndex - syncedActivities.length;
    if (manualIdx >= 0 && manualIdx < manualActivities.length) {
      const updated = [...manualActivities];
      updated[manualIdx] = { ...updated[manualIdx], imageUrl: undefined };
      setManualActivities(updated);
    }
  };

  const addActivity = () => {
    const newAct: ItineraryActivity = { time: '12:00 PM', title: 'New Activity', location: '', notes: '', iconType: 'activity' };
    setManualActivities([...manualActivities, newAct]);
  };

  const moveActivity = (index: number, direction: 'up' | 'down') => {
    // Only allow reordering of manual activities
    const manualIdx = index - syncedActivities.length;
    if (manualIdx < 0) return;
    const newIndex = direction === 'up' ? manualIdx - 1 : manualIdx + 1;
    if (newIndex < 0 || newIndex >= manualActivities.length) return;
    const newActivities = [...manualActivities];
    [newActivities[manualIdx], newActivities[newIndex]] = [newActivities[newIndex], newActivities[manualIdx]];
    setManualActivities(newActivities);
  };

  const cycleIcon = (activityIndex: number) => {
    const manualIdx = activityIndex - syncedActivities.length;
    if (manualIdx < 0) return;
    const types: ItineraryActivity['iconType'][] = ['hotel', 'flight', 'dining', 'activity', 'spa', 'beach', 'sightseeing', 'transport', 'default'];
    const current = manualActivities[manualIdx].iconType || 'default';
    const currentIdx = types.indexOf(current);
    const next = types[(currentIdx + 1) % types.length];
    const updated = [...manualActivities];
    updated[manualIdx] = { ...updated[manualIdx], iconType: next };
    setManualActivities(updated);
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
            {/* Editable destination */}
            <div className="pt-5 pb-2 px-2">
              {editingTitle ? (
                <input
                  value={titleDest}
                  onChange={(e) => setTitleDest(e.target.value)}
                  onBlur={() => {
                    setDestination(titleDest);
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (setDestination(titleDest), setEditingTitle(false))}
                  autoFocus
                  className="font-serif text-lg text-foreground bg-transparent border-b border-primary focus:outline-none w-full"
                />
              ) : (
                <button onClick={() => { setTitleDest(destination); setEditingTitle(true); }} className="text-left w-full">
                  <span className="font-serif text-lg text-foreground/70 hover:text-foreground transition-colors">
                    {destination}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">tap to edit</span>
                </button>
              )}
            </div>

            {/* Timeline */}
            <div className="py-4 relative">
              {allActivities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic px-2">No activities planned yet</p>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[31px] top-4 bottom-4 w-[2.5px] bg-primary/60" />

                  <div className="space-y-3">
                    {allActivities.map((act, i) => {
                      const IconComponent = iconMap[act.iconType || 'default'] || iconMap.default;
                      const isSynced = i < syncedActivities.length;
                      return (
                        <div key={`${act.title}-${i}`} className="flex gap-3 sm:gap-4 items-start relative">
                          {/* Left: Timeline node */}
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
                                <button
                                  onClick={() => fileInputRefs.current[i]?.click()}
                                  className="absolute inset-0 bg-foreground/0 hover:bg-foreground/20 transition-colors rounded-full"
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => !isSynced && fileInputRefs.current[i]?.click()}
                                onContextMenu={(e) => { e.preventDefault(); if (!isSynced) cycleIcon(i); }}
                                className="w-[62px] h-[62px] rounded-full bg-card flex items-center justify-center border-2 border-primary/40 shadow-soft cursor-pointer hover:border-primary/60 transition-colors"
                                title={isSynced ? 'Synced from overview' : 'Click to upload photo, right-click to change icon'}
                              >
                                <IconComponent size={24} strokeWidth={1.8} className="text-primary-foreground" />
                              </button>
                            )}
                          </div>

                          {/* Right: Content card */}
                          <div className={`flex-1 min-w-0 bg-card rounded-l-2xl sm:rounded-2xl p-4 shadow-soft -mr-6 sm:mr-0 pr-10 sm:pr-4 relative ${isSynced ? 'border-l-2 border-primary/30' : ''}`}>
                            {act.time && (
                              <span className="text-[11px] font-medium text-foreground/50 tracking-wider uppercase block mb-1">{act.time}</span>
                            )}
                            <h4 className="font-serif text-base text-foreground leading-snug">{act.title}</h4>
                            {act.location && (
                              <p className="text-xs text-muted-foreground mt-0.5">{act.location}</p>
                            )}
                            {act.notes && (
                              <p className="text-xs text-foreground/40 mt-1">{act.notes}</p>
                            )}

                            {/* Reorder buttons - only for manual activities */}
                            {!isSynced && (
                              <div className="absolute top-3 right-3 sm:right-4 flex flex-col gap-0.5">
                                <button
                                  onClick={() => moveActivity(i, 'up')}
                                  disabled={i <= syncedActivities.length}
                                  className="p-1 text-foreground/30 hover:text-foreground/70 disabled:opacity-20 transition-colors"
                                >
                                  <ArrowUp size={14} strokeWidth={1.8} />
                                </button>
                                <button
                                  onClick={() => moveActivity(i, 'down')}
                                  disabled={i >= allActivities.length - 1}
                                  className="p-1 text-foreground/30 hover:text-foreground/70 disabled:opacity-20 transition-colors"
                                >
                                  <ArrowDown size={14} strokeWidth={1.8} />
                                </button>
                              </div>
                            )}
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

  // For each day, compute synced activities
  const startDate = tripData ? parseDateString(tripData.date) : null;

  return (
    <div className="space-y-4 pb-20">
      {displayDays.map((day, i) => {
        let dayDate: Date | null = null;
        if (startDate) {
          dayDate = new Date(startDate);
          dayDate.setDate(dayDate.getDate() + i);
        }

        const syncedActivities = dayDate
          ? buildSyncedActivities(dayDate, transportItems, accommodationItems, activityItems, reservationItems)
          : [];

        return (
          <ItineraryItem key={day.id} day={day} syncedActivities={syncedActivities} />
        );
      })}
    </div>
  );
};

export default ItineraryTab;
