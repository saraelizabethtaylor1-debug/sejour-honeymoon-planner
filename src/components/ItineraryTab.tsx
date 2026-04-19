import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Bed, Plane, UtensilsCrossed, Sparkles, Palmtree, Landmark, Bus, Camera, ImagePlus, Trash2, ExternalLink, Ship, TrainFront, Car, Map, Star } from 'lucide-react';
import PlacesAutocomplete from '@/components/PlacesAutocomplete';
import ImagePickerModal from '@/components/ImagePickerModal';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItineraryDay, ItineraryActivity, TransportItem, AccommodationItem, ActivityItem, ReservationItem } from '@/types/honeymoon';
import { parseDateString } from '@/lib/dateUtils';

interface ItineraryTabProps {
  days: ItineraryDay[];
  tripData?: { date: string; days: number; destination: string; clockFormat?: '12h' | '24h' };
  transportItems?: TransportItem[];
  accommodationItems?: AccommodationItem[];
  activityItems?: ActivityItem[];
  reservationItems?: ReservationItem[];
  onAddActivity?: (activity: ActivityItem) => void;
  onRemoveActivity?: (id: string) => void;
  onGoToSettings?: () => void;
  onDaysChange?: (days: ItineraryDay[]) => void;
}

const iconMap: Record<string, typeof Bed> = {
  hotel: Bed,
  flight: Plane,
  ferry: Ship,
  train: TrainFront,
  car: Car,
  dining: UtensilsCrossed,
  activity: Star,
  spa: Sparkles,
  beach: Palmtree,
  sightseeing: Landmark,
  transport: Car,
  default: Star,
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

/** Convert a 24h time string like "14:30" to "2:30 PM" when clockFormat is '12h'. */
const formatTime = (time: string, clockFormat?: '12h' | '24h'): string => {
  if (!time || clockFormat !== '12h') return time;
  // Already contains AM/PM — already 12h
  if (/[ap]m/i.test(time)) return time;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
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
  lat?: number;
  lng?: number;
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
    if (!t.date || !t.type) continue;
    const itemDate = extractDateForComparison(t.date, fallbackYear);
    if (itemDate && isSameDay(itemDate, dayDate)) {
      const locationParts = [t.departureLocation, t.arrivalLocation].filter(Boolean);
      const locationStr = locationParts.length === 2 ? `${locationParts[0]} → ${locationParts[1]}` : locationParts[0] || '';
      const typeLC = t.type.toLowerCase();
      const iconKey = typeLC === 'plane' ? 'flight' : typeLC === 'ferry' ? 'ferry' : typeLC === 'train' ? 'train' : typeLC === 'car' ? 'car' : 'transport';
      activities.push({
        _uid: `sync-transport-${t.id}`,
        _synced: true,
        time: t.time || '',
        title: `${({ plane: 'Flight', ferry: 'Ferry', train: 'Train', car: 'Car' } as Record<string, string>)[typeLC] || t.type}${t.details ? ': ' + t.details : ''}`,
        location: locationStr,
        notes: t.confirmation || '',
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

/* ── Travel time connector between activity cards ── */
const DriveTimeConnector = ({ fromLat, fromLng, toLat, toLng, fromLocation, toLocation }: {
  fromLat?: number; fromLng?: number; toLat?: number; toLng?: number;
  fromLocation?: string; toLocation?: string;
}) => {
  const [info, setInfo] = useState<{ duration: string; mode: 'driving' | 'walking' } | null>(null);

  const origin: google.maps.LatLngLiteral | string | null =
    (fromLat != null && fromLng != null) ? { lat: fromLat, lng: fromLng } : fromLocation?.trim() || null;
  const destination: google.maps.LatLngLiteral | string | null =
    (toLat != null && toLng != null) ? { lat: toLat, lng: toLng } : toLocation?.trim() || null;

  // Directions API fallback — used when Distance Matrix is not enabled on the key
  const tryDirections = useCallback((
    org: google.maps.LatLngLiteral | string,
    dest: google.maps.LatLngLiteral | string,
    mode: google.maps.TravelMode,
    onResult: (duration: string, distanceMeters: number) => void,
    onFail: () => void,
  ) => {
    const svc = new google.maps.DirectionsService();
    svc.route(
      { origin: org, destination: dest, travelMode: mode },
      (result, status) => {
        if (status === 'OK' && result) {
          const leg = result.routes[0]?.legs[0];
          const duration = leg?.duration?.text;
          const meters = leg?.distance?.value ?? Infinity;
          if (duration) { onResult(duration, meters); return; }
        }
        console.error('[DriveTimeConnector] Directions API error:', status, { org, dest, mode });
        onFail();
      }
    );
  }, []);

  useEffect(() => {
    if (!origin || !destination) return;
    if (!window.google?.maps) {
      console.warn('[DriveTimeConnector] Google Maps not loaded yet');
      return;
    }

    setInfo(null);
    console.log('[DriveTimeConnector] Requesting travel time', { origin, destination });

    const applyResult = (drivingDuration: string, distanceMeters: number) => {
      if (distanceMeters < 1000) {
        // Under 1 km — prefer walking
        const walkFallback = () => setInfo({ duration: drivingDuration, mode: 'driving' });
        const dmSvc = new google.maps.DistanceMatrixService();
        dmSvc.getDistanceMatrix(
          { origins: [origin!], destinations: [destination!], travelMode: google.maps.TravelMode.WALKING },
          (wRes, wStatus) => {
            if (wStatus === 'OK' && wRes) {
              const wEl = wRes.rows[0]?.elements[0];
              if (wEl?.status === 'OK' && wEl.duration?.text) {
                setInfo({ duration: wEl.duration.text, mode: 'walking' });
                return;
              }
              console.warn('[DriveTimeConnector] Walking element status:', wEl?.status);
            } else if (wStatus === 'REQUEST_DENIED') {
              // Distance Matrix not enabled — try Directions for walking
              tryDirections(origin!, destination!, google.maps.TravelMode.WALKING,
                (dur) => setInfo({ duration: dur, mode: 'walking' }),
                walkFallback,
              );
              return;
            } else {
              console.warn('[DriveTimeConnector] Walking Distance Matrix status:', wStatus);
            }
            walkFallback();
          }
        );
      } else {
        setInfo({ duration: drivingDuration, mode: 'driving' });
      }
    };

    // Try Distance Matrix first
    const dmSvc = new google.maps.DistanceMatrixService();
    dmSvc.getDistanceMatrix(
      { origins: [origin], destinations: [destination], travelMode: google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === 'OK' && result) {
          const el = result.rows[0]?.elements[0];
          if (el?.status === 'OK') {
            const meters = el.distance?.value ?? Infinity;
            const duration = el.duration?.text;
            if (duration) { applyResult(duration, meters); return; }
          }
          console.warn('[DriveTimeConnector] Distance Matrix element status:', el?.status, el);
          return;
        }

        console.warn('[DriveTimeConnector] Distance Matrix status:', status, '— trying Directions API fallback');

        // Fallback: Directions API
        tryDirections(origin!, destination!, google.maps.TravelMode.DRIVING,
          (duration, meters) => applyResult(duration, meters),
          () => { /* both APIs failed — connector stays hidden */ },
        );
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLat, fromLng, toLat, toLng, fromLocation, toLocation]);

  if (!origin || !destination || !info) return null;

  return (
    <div className="flex items-center gap-2 ml-[28px] py-0.5">
      <div className="flex flex-col items-center">
        <div className="w-px h-2.5 bg-primary/20" />
        <span className="text-[11px] leading-none my-0.5">{info.mode === 'walking' ? '🚶' : '🚗'}</span>
        <div className="w-px h-2.5 bg-primary/20" />
      </div>
      <span className="font-body text-[11px] text-foreground/35">{info.duration}</span>
    </div>
  );
};

/* ── Sortable Activity Card ── */
interface SortableActivityProps {
  activity: TaggedActivity;
  id: string;
  clockFormat?: '12h' | '24h';
  onUpdate: (fields: Partial<ItineraryActivity> & { lat?: number; lng?: number }) => void;
  onSelectImage: (url: string) => void;
  onRemoveImage: () => void;
  onDelete: () => void;
}

const SortableActivityCard = ({ activity: act, id, clockFormat, onUpdate, onSelectImage, onRemoveImage, onDelete }: SortableActivityProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };
  const IconComponent = iconMap[act.iconType || 'default'] || iconMap.default;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleBlur = (field: string, value: string) => {
    onUpdate({ [field]: value });
    setEditingField(null);
  };

  const mapsUrl = act.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`
    : null;

  const displayTime = formatTime(act.time ? act.time.replace(/^.*?,\s*/, '') : '', clockFormat);

  return (
    <div ref={setNodeRef} style={style} className="flex items-start relative group/item">
      {/* Timeline dot */}
      <div className="flex-shrink-0 w-8 flex justify-center pt-6 relative z-10">
        <div className="w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: '#8d604f', borderColor: '#8d604f' }} />
      </div>

      {/* Card */}
      <div className="flex-1 bg-card rounded-2xl shadow-soft flex gap-0 min-w-0 overflow-hidden">

        {/* Drag handle strip — ~32px wide, warm tint, faint right border */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 w-8 self-stretch flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          style={{ background: 'hsl(0 25% 96%)', borderRight: '1px solid hsl(0 16% 90%)' }}
        >
          <div className="grid grid-cols-2 gap-[3.5px]">
            <div className="w-[3.5px] h-[3.5px] rounded-full bg-foreground/25" />
            <div className="w-[3.5px] h-[3.5px] rounded-full bg-foreground/25" />
            <div className="w-[3.5px] h-[3.5px] rounded-full bg-foreground/25" />
            <div className="w-[3.5px] h-[3.5px] rounded-full bg-foreground/25" />
            <div className="w-[3.5px] h-[3.5px] rounded-full bg-foreground/25" />
            <div className="w-[3.5px] h-[3.5px] rounded-full bg-foreground/25" />
          </div>
        </div>

        {/* Content block */}
        <div className="flex-1 min-w-0 py-4 pl-3 pr-4">
          {/* Icon + time/name row */}
          <div className="flex items-start gap-3 mb-1">
            {/* Icon — sized to span both time and name lines */}
            <div
              className="flex-shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
              style={{ width: 36, height: 36 }}
            >
              <IconComponent size={17} strokeWidth={1.4} className="text-primary-foreground" />
            </div>
            {/* Stacked text: time on top, name below */}
            <div className="flex-1 min-w-0">
              {!act._uid?.includes('sync-acc-stay-') && (
                editingField === 'time' ? (
                  <input
                    autoFocus
                    defaultValue={act.time}
                    onBlur={(e) => handleBlur('time', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlur('time', (e.target as HTMLInputElement).value)}
                    className="text-[11px] font-light text-foreground/45 block mb-0.5 bg-transparent border-b border-primary/40 focus:outline-none w-full"
                  />
                ) : (
                  <button onClick={() => setEditingField('time')} className="text-left w-full">
                    <span className="text-[11px] font-light text-foreground/45 block mb-0.5 hover:text-foreground/65 transition-colors">
                      {displayTime || 'Add time'}
                    </span>
                  </button>
                )
              )}
              {editingField === 'title' ? (
                <input
                  autoFocus
                  defaultValue={act.title}
                  onBlur={(e) => handleBlur('title', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBlur('title', (e.target as HTMLInputElement).value)}
                  className="leading-snug bg-transparent border-b border-primary/40 focus:outline-none w-full text-foreground"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px' }}
                />
              ) : (
                <button onClick={() => setEditingField('title')} className="text-left w-full">
                  <h4 className="leading-snug text-foreground hover:text-foreground/70 transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px' }}>{act.title}</h4>
                </button>
              )}
            </div>
          </div>

          {/* Location */}
          <PlacesAutocomplete
            value={act.location || ''}
            onChange={(val) => onUpdate({ location: val })}
            onPlaceSelect={(result) => onUpdate({ location: result.address, lat: result.lat, lng: result.lng })}
            placeholder="Add location"
            className="text-xs text-muted-foreground mt-0.5 bg-transparent focus:outline-none w-full placeholder:text-foreground/25 focus:placeholder:text-foreground/40 transition-colors"
          />

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

          {/* View on map */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-2.5 text-xs text-primary-foreground hover:text-primary-foreground/70 transition-colors"
            >
              <span>View on map</span>
              <ExternalLink size={10} strokeWidth={1.5} />
            </a>
          )}
        </div>

        {/* Photo — perfect square flush right, delete button bottom-left */}
        <div className="flex-shrink-0 self-stretch w-24 overflow-hidden relative">
          {pickerOpen && (
            <ImagePickerModal
              onSelect={(url) => { onSelectImage(url); setPickerOpen(false); }}
              onClose={() => setPickerOpen(false)}
            />
          )}
          {act.imageUrl ? (
            <div className="w-full h-full">
              <img src={act.imageUrl} alt={act.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full h-full bg-primary/5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <Plus size={14} strokeWidth={1.2} className="text-foreground/30" />
              <span className="text-[10px] text-foreground/30">photo</span>
            </button>
          )}
          {/* Delete — secondary action, bottom-left of photo */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute bottom-2 left-2 p-1 rounded-md transition-all opacity-0 group-hover/item:opacity-100 hover:bg-background/60"
          >
            <Trash2 size={12} strokeWidth={1.3} className="text-foreground/25 hover:text-destructive transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Itinerary Day Item ── */
const ItineraryItem = ({
  day: initialDay,
  syncedActivities,
  dayDateStr,
  dayNumber,
  clockFormat,
  onAddActivity,
  onRemoveActivity,
  onDayChange,
}: {
  day: ItineraryDay;
  syncedActivities: TaggedActivity[];
  dayDateStr: string;
  dayNumber: number;
  clockFormat?: '12h' | '24h';
  onAddActivity?: (activity: ActivityItem) => void;
  onRemoveActivity?: (id: string) => void;
  onDayChange?: (destination: string, activities: ItineraryActivity[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState(initialDay.destination);
  const [editingDestination, setEditingDestination] = useState(false);

  const [orderedActivities, setOrderedActivities] = useState<TaggedActivity[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Track the last-persisted snapshot so we only call onDayChange when content
  // actually changes. Using JSON content (not array reference) means React
  // StrictMode's double-invoke of effects — which creates new array references
  // with identical content — does not trigger a spurious save on mount.
  const prevActivitiesJsonRef = useRef<string | null>(null);
  const prevDestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    const manualActivities: ItineraryActivity[] = orderedActivities
      .filter(a => !a._synced)
      .map((a): ItineraryActivity => ({
        time: a.time,
        title: a.title,
        location: a.location,
        notes: a.notes,
        imageUrl: a.imageUrl,
        iconType: a.iconType,
      }));
    const activitiesJson = JSON.stringify(manualActivities);

    if (prevActivitiesJsonRef.current === null || prevDestRef.current === null) {
      // First run after initialization — record baseline, do not fire.
      prevActivitiesJsonRef.current = activitiesJson;
      prevDestRef.current = destination;
      return;
    }
    if (prevActivitiesJsonRef.current === activitiesJson && prevDestRef.current === destination) {
      return; // content unchanged (e.g. StrictMode re-run with new array reference)
    }
    prevActivitiesJsonRef.current = activitiesJson;
    prevDestRef.current = destination;
    onDayChange?.(destination, manualActivities);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedActivities, destination, initialized]);

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

  const updateActivity = useCallback((uid: string, fields: Partial<ItineraryActivity> & { lat?: number; lng?: number }) => {
    setOrderedActivities(prev =>
      prev.map(a => {
        if (a._uid !== uid) return a;
        const updated = { ...a, ...fields };
        if (fields.title) updated.iconType = guessIconType(fields.title);
        return updated;
      })
    );
  }, []);

  const handleSelectImage = useCallback((uid: string, url: string) => {
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
  };

  const paddedNumber = String(dayNumber).padStart(2, '0');
  const dayWord = numberToWord(dayNumber).toUpperCase();

  return (
    <div>
      {/* Day accordion header */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 sm:px-6 py-4 bg-[#f6ebe9] rounded-full transition-shadow hover:bg-[#f6ebe9]/90"
      >
        <div className="flex items-center gap-4">
          <span className="font-serif text-3xl sm:text-4xl font-light leading-none" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#000000' }}>
            {paddedNumber}
          </span>
          <div className="flex flex-col items-start">
            <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: '#000000' }}>
              Day {dayWord}
            </span>
            <span className="font-serif text-sm sm:text-base leading-snug" style={{ color: '#000000' }}>
              {initialDay.date} · {editingDestination ? null : (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingDestination(true); }}
                  className="hover:opacity-60 transition-opacity"
                >
                  {destination || 'Add destination'}
                </button>
              )}
              {editingDestination && (
                <input
                  autoFocus
                  defaultValue={destination}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => { setDestination(e.target.value); setEditingDestination(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setDestination((e.target as HTMLInputElement).value); setEditingDestination(false); } }}
                  className="bg-transparent border-b border-black/40 focus:outline-none font-serif text-sm sm:text-base w-24 sm:w-32" style={{ color: '#000000' }}
                />
              )}
            </span>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} style={{ color: '#000000', opacity: 0.5 }} />
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
            <div className="pt-6 pb-2 relative">
              {orderedActivities.length === 0 ? (
                <p className="text-muted-foreground font-serif italic px-10 py-4">No activities planned yet</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-6 bottom-0 w-[1.5px] border-t-0 bg-foreground/10" />

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
                      <div>
                        {orderedActivities.map((act, idx) => (
                          <div key={act._uid} className="mb-4">
                            {idx > 0 && (
                              <DriveTimeConnector
                                fromLat={orderedActivities[idx - 1].lat}
                                fromLng={orderedActivities[idx - 1].lng}
                                fromLocation={orderedActivities[idx - 1].location}
                                toLat={act.lat}
                                toLng={act.lng}
                                toLocation={act.location}
                              />
                            )}
                            <SortableActivityCard
                              id={act._uid}
                              activity={act}
                              clockFormat={clockFormat}
                              onUpdate={(fields) => updateActivity(act._uid, fields)}
                              onSelectImage={(url) => handleSelectImage(act._uid, url)}
                              onRemoveImage={() => removeImage(act._uid)}
                              onDelete={() => deleteActivity(act._uid)}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>

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

const ItineraryTab = ({ days, tripData, transportItems = [], accommodationItems = [], activityItems = [], reservationItems = [], onAddActivity, onRemoveActivity, onGoToSettings, onDaysChange }: ItineraryTabProps) => {
  const displayDays = days.length > 0 ? days : (tripData ? generateDaysFromTrip(tripData) : []);
  const startDate = tripData ? parseDateString(tripData.date) : null;
  const fallbackYear = startDate ? startDate.getFullYear() : new Date().getFullYear();
  const clockFormat = tripData?.clockFormat;

  // Refs for propagating per-day changes up to the parent
  const displayDaysRef = useRef<ItineraryDay[]>(displayDays);
  displayDaysRef.current = displayDays;
  const dayOverridesRef = useRef<globalThis.Map<string, { destination: string; activities: ItineraryActivity[] }>>(new globalThis.Map());

  const handleDayChange = useCallback((dayId: string, destination: string, activities: ItineraryActivity[]) => {
    dayOverridesRef.current.set(dayId, { destination, activities });
    const updated = displayDaysRef.current.map(d => {
      const override = dayOverridesRef.current.get(d.id);
      return override ? { ...d, destination: override.destination, activities: override.activities } : d;
    });
    onDaysChange?.(updated);
  }, [onDaysChange]);

  return (
    <div className="w-full">
      <div className="max-w-[1300px] mx-auto px-6 space-y-1 pb-20">
      {displayDays.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-24 text-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-1">
            <Map size={26} strokeWidth={1.2} style={{ color: 'hsl(0 20% 52%)' }} />
          </div>
          <div className="space-y-1.5">
            <p className="font-serif text-2xl text-foreground/75">Your adventure awaits</p>
            <p className="font-body text-sm text-foreground/50 max-w-[260px] leading-relaxed">
              Add your trip dates to start building your itinerary.
            </p>
          </div>
          {onGoToSettings && (
            <button
              onClick={onGoToSettings}
              className="font-serif text-sm mt-1 transition-colors"
              style={{ color: 'hsl(0 20% 52%)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'hsl(0 20% 38%)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'hsl(0 20% 52%)')}
            >
              Edit trip settings →
            </button>
          )}
        </motion.div>
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
              clockFormat={clockFormat}
              onAddActivity={onAddActivity}
              onRemoveActivity={onRemoveActivity}
              onDayChange={(dest, acts) => handleDayChange(day.id, dest, acts)}
            />
          );
        })
      )}
      </div>
    </div>
  );
};

export default ItineraryTab;
