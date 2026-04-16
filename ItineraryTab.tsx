import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Bed, Plane, UtensilsCrossed, Sparkles, Palmtree, Landmark, Bus, Camera, ImagePlus, Trash2, ExternalLink, Ship, TrainFront, Car, Map, Star } from 'lucide-react';
import PlacesAutocomplete from '@/components/PlacesAutocomplete';
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

  const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
  const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`;

  return (
    <div className="ml-8 flex items-center justify-center gap-2 py-1 text-foreground/35">
      {/* Mode icon + duration */}
      {info.mode === 'walking' ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13" cy="4" r="1.5"/><path d="M9 20l1.5-5 2.5 2 1-5.5"/><path d="M6.5 13.5l2-6.5 4 1.5-1 3.5h3"/>
        </svg>
      ) : (
        <svg width="13" height="11" viewBox="0 0 24 16" fill="currentColor">
          <path d="M22 8h-1L18.5 2A2 2 0 0 0 16.7 1H7.3A2 2 0 0 0 5.5 2L3 8H2A2 2 0 0 0 0 10v3a1 1 0 0 0 1 1h1a3 3 0 0 0 6 0h8a3 3 0 0 0 6 0h1a1 1 0 0 0 1-1v-3a2 2 0 0 0-2-2zM7.3 3h9.4l2 5H5.3l2-5zM5 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm14 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      )}
      <span className="font-body text-[11px]">{info.duration}</span>
      {/* Downward chevron */}
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-foreground/20">
        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {/* Directions link */}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-[11px] hover:text-foreground/60 transition-colors underline-offset-2 hover:underline"
      >
        Directions
      </a>
    </div>
  );
};

/* ── Sortable Activity Card ── */
interface SortableActivityProps {
  activity: TaggedActivity;
  id: string;
  clockFormat?: '12h' | '24h';
  onUpdate: (fields: Partial<ItineraryActivity> & { lat?: number; lng?: number }) => void;
  onImageUpload: (file: File) => void;
  onRemoveImage: () => void;
  onDelete: () => void;
}

const SortableActivityCard = ({ activity: act, id, clockFormat, onUpdate, onImageUpload, onRemoveImage, onDelete }: SortableActivityProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };
  const IconComponent = iconMap[act.iconType || 'default'] || iconMap.default;
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoTab, setPhotoTab] = useState<'upload' | 'search'>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{url: string, thumb: string, title: string}[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleImageSearch = async () => {
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
      const cx = import.meta.env.VITE_GOOGLE_SEARCH_CX;
      const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=9`);
      const data = await res.json();
      if (data.error) { setSearchError(data.error.message); return; }
      setSearchResults((data.items || []).map((item: any) => ({ url: item.link, thumb: item.image?.thumbnailLink || item.link, title: item.title })));
    } catch (e) {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

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
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden', width: '100%', background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px -2px rgba(0,0,0,0.06)', border: '0.5px solid rgba(0,0,0,0.06)' }}>

        {/* Left column: drag handle only */}
        <div className="flex-shrink-0 flex flex-col items-center pt-6 pb-3 px-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="grid grid-cols-2 gap-[3px]">
              <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
              <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
              <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
              <div className="w-[4px] h-[4px] rounded-full bg-foreground/20" />
            </div>
          </div>
        </div>

        {/* Content block */}
        <div className="flex-1 min-w-0 py-4 pr-4">
          {/* Icon + Time row */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <IconComponent size={14} strokeWidth={1.4} className="text-primary-foreground" />
            </div>
            {!act._uid?.includes('sync-acc-stay-') && (
              <>
                {editingField === 'time' ? (
                  <input
                    autoFocus
                    defaultValue={act.time}
                    onBlur={(e) => handleBlur('time', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlur('time', (e.target as HTMLInputElement).value)}
                    className="text-[11px] font-medium text-foreground/50 tracking-wider uppercase bg-transparent border-b border-primary/40 focus:outline-none"
                  />
                ) : (
                  <button onClick={() => setEditingField('time')} className="text-left">
                    <span className="text-[11px] font-medium text-foreground/50 tracking-wider uppercase hover:text-foreground/70 transition-colors">
                      {displayTime || 'Add time'}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
          {/* Title — own line */}
          <div className="mb-0.5">
            {editingField === 'title' ? (
              <input
                autoFocus
                defaultValue={act.title}
                onBlur={(e) => handleBlur('title', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur('title', (e.target as HTMLInputElement).value)}
                className="font-serif text-base font-semibold text-foreground leading-snug bg-transparent border-b border-primary/40 focus:outline-none flex-1 w-full"
              />
            ) : (
              <button onClick={() => setEditingField('title')} className="text-left">
                <h4 className="font-serif text-base font-semibold text-foreground leading-snug hover:text-foreground/70 transition-colors">{act.title}</h4>
              </button>
            )}
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

        {/* Photo — fixed 120×120 square */}
        <div style={{ width: '120px', minWidth: '120px', maxWidth: '120px', height: '120px', minHeight: '120px', maxHeight: '120px', overflow: 'hidden', flexShrink: 0, alignSelf: 'flex-start', borderRadius: '8px', position: 'relative', cursor: 'pointer' }} onClick={() => setShowPhotoModal(true)}>
          {act.imageUrl ? (
            <>
              <img src={act.imageUrl} alt={act.title} style={{ width: '120px', height: '120px', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover:!opacity-100">
                <span style={{ color: 'white', fontSize: '11px', fontWeight: 500 }}>Change</span>
              </div>
            </>
          ) : (
            <div style={{ width: '120px', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(0,0,0,0.03)' }}>
              <Plus size={14} strokeWidth={1.2} className="text-foreground/30" />
              <span className="text-[10px] text-foreground/30">photo</span>
            </div>
          )}
        </div>

        {/* Photo Modal */}
        {showPhotoModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowPhotoModal(false)}>
            <div style={{ background: 'hsl(25 33% 96%)', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 500, margin: 0 }}>Add Photo</h2>
                <button onClick={() => setShowPhotoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#888' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 0, padding: '12px 24px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                {(['upload', 'search'] as const).map(t => (
                  <button key={t} onClick={() => setPhotoTab(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px 10px', fontSize: '13px', fontWeight: photoTab === t ? 500 : 400, color: photoTab === t ? '#8d604f' : '#888', borderBottom: photoTab === t ? '2px solid #8d604f' : '2px solid transparent', marginBottom: '-1px' }}>
                    {t === 'upload' ? 'Upload' : 'Search web'}
                  </button>
                ))}
              </div>
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {photoTab === 'upload' ? (
                  <button onClick={() => { fileRef.current?.click(); setShowPhotoModal(false); }} style={{ width: '100%', padding: '40px', border: '1.5px dashed rgba(0,0,0,0.15)', borderRadius: '12px', background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Plus size={20} strokeWidth={1.2} style={{ color: '#8d604f' }} />
                    <span style={{ fontSize: '13px', color: '#8d604f' }}>Click to upload a photo</span>
                  </button>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleImageSearch()} placeholder="Search for images..." style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', background: 'white', fontSize: '13px', outline: 'none' }} />
                      <button onClick={handleImageSearch} style={{ padding: '10px 16px', background: '#8d604f', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>Search</button>
                    </div>
                    <p style={{ fontSize: '11px', color: '#999', marginBottom: '12px', lineHeight: 1.5 }}>Before selecting an image, click through and verify that you have the right to use the listed images.</p>
                    {searchError && <p style={{ color: '#c0392b', fontSize: '12px', marginBottom: 8 }}>{searchError}</p>}
                    {searching && <p style={{ color: '#888', fontSize: '13px' }}>Searching...</p>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {searchResults.map((img, i) => (
                        <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => { onUpdate({ imageUrl: img.url }); setShowPhotoModal(false); }}>
                          <img src={img.thumb} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="hover:!opacity-100">
                            <span style={{ color: 'white', fontSize: '11px', fontWeight: 500 }}>Select</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="absolute top-3 right-3 p-1.5 hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
        >
          <Trash2 size={13} strokeWidth={1.3} className="text-foreground/30 hover:text-destructive transition-colors" />
        </button>
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
  clockFormat,
  onAddActivity,
  onRemoveActivity,
}: {
  day: ItineraryDay;
  syncedActivities: TaggedActivity[];
  dayDateStr: string;
  dayNumber: number;
  clockFormat?: '12h' | '24h';
  onAddActivity?: (activity: ActivityItem) => void;
  onRemoveActivity?: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState(initialDay.destination);
  const [editingDestination, setEditingDestination] = useState(false);

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
      {/* Day accordion header */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 sm:px-6 py-4 bg-[#f7e6e2] rounded-full transition-shadow hover:bg-[#f7e6e2]/90"
      >
        <div className="flex items-center gap-4">
          <span className="font-serif text-3xl sm:text-4xl font-light leading-none" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#4a3028' }}>
            {paddedNumber}
          </span>
          <div className="flex flex-col items-start">
            <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: '#4a3028' }}>
              Day {dayWord}
            </span>
            <span className="font-serif text-sm sm:text-base leading-snug" style={{ color: '#4a3028' }}>
              {initialDay.date} · {editingDestination ? null : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setEditingDestination(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setEditingDestination(true); } }}
                  className="hover:opacity-60 transition-opacity cursor-pointer"
                >
                  {destination || 'Add destination'}
                </span>
              )}
              {editingDestination && (
                <input
                  autoFocus
                  defaultValue={destination}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => { setDestination(e.target.value); setEditingDestination(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setDestination((e.target as HTMLInputElement).value); setEditingDestination(false); } e.stopPropagation(); }}
                  className="bg-transparent border-b border-[#4a3028]/40 focus:outline-none font-serif text-sm sm:text-base w-24 sm:w-32" style={{ color: '#4a3028' }}
                />
              )}
            </span>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} style={{ color: '#4a3028', opacity: 0.5 }} />
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
                              onImageUpload={(file) => handleImageUpload(act._uid, file)}
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

const ItineraryTab = ({ days, tripData, transportItems = [], accommodationItems = [], activityItems = [], reservationItems = [], onAddActivity, onRemoveActivity, onGoToSettings }: ItineraryTabProps) => {
  const displayDays = days.length > 0 ? days : (tripData ? generateDaysFromTrip(tripData) : []);
  const startDate = tripData ? parseDateString(tripData.date) : null;
  const fallbackYear = startDate ? startDate.getFullYear() : new Date().getFullYear();
  const clockFormat = tripData?.clockFormat;

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
            />
          );
        })
      )}
      </div>
    </div>
  );
};

export default ItineraryTab;
