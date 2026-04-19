import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { defaultTripData } from '@/data/sampleData';
import type {
  TripData,
  TransportItem,
  AccommodationItem,
  ActivityItem,
  ReservationItem,
  ItineraryDay,
  ItineraryActivity,
} from '@/types/honeymoon';

// ── Column mappers ──────────────────────────────────────────────────────────

function toDbTransport(item: TransportItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    type: item.type,
    details: item.details,
    confirmation: item.confirmation,
    // Keep date/time populated for itinerary sync (ItineraryTab matches transport to days via t.date)
    date: item.date || '',
    time: item.time || '',
    cost: item.cost,
    departure_location: item.departureLocation ?? null,
    departure_lat: item.departureLat ?? null,
    departure_lng: item.departureLng ?? null,
    arrival_location: item.arrivalLocation ?? null,
    arrival_lat: item.arrivalLat ?? null,
    arrival_lng: item.arrivalLng ?? null,
    location: item.location ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    // takeoff_date, takeoff_time, landing_date, landing_time omitted until migration 20260419000000 is applied
  };
}

function fromDbTransport(row: Record<string, unknown>): TransportItem {
  // takeoff_date/time are the dedicated columns; fall back to legacy date/time for older rows
  const takeoffDate = (row.takeoff_date as string) || (row.date as string) || '';
  const takeoffTime = (row.takeoff_time as string) || (row.time as string) || '';
  return {
    id: row.id as string,
    type: (row.type as string) || '',
    details: (row.details as string) || '',
    confirmation: (row.confirmation as string) || '',
    date: takeoffDate,
    time: takeoffTime,
    cost: (row.cost as number) || 0,
    departureLocation: (row.departure_location as string) || undefined,
    departureLat: (row.departure_lat as number) || undefined,
    departureLng: (row.departure_lng as number) || undefined,
    arrivalLocation: (row.arrival_location as string) || undefined,
    arrivalLat: (row.arrival_lat as number) || undefined,
    arrivalLng: (row.arrival_lng as number) || undefined,
    location: (row.location as string) || undefined,
    lat: (row.lat as number) || undefined,
    lng: (row.lng as number) || undefined,
    takeoffDate,
    takeoffTime,
    landingDate: (row.landing_date as string) || '',
    landingTime: (row.landing_time as string) || '',
  };
}

function toDbAccommodation(item: AccommodationItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    address: item.address,
    check_in: item.checkIn,
    check_in_time: item.checkInTime,
    check_out: item.checkOut,
    check_out_time: item.checkOutTime,
    confirmation: item.confirmation,
    cost: item.cost,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
  };
}

function fromDbAccommodation(row: Record<string, unknown>): AccommodationItem {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    address: (row.address as string) || '',
    checkIn: (row.check_in as string) || '',
    checkInTime: (row.check_in_time as string) || '',
    checkOut: (row.check_out as string) || '',
    checkOutTime: (row.check_out_time as string) || '',
    confirmation: (row.confirmation as string) || '',
    cost: (row.cost as number) || 0,
    lat: (row.lat as number) || undefined,
    lng: (row.lng as number) || undefined,
  };
}

function toDbActivity(item: ActivityItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    notes: item.notes,
    time: item.time,
    confirmation: item.confirmation,
    cost: item.cost,
    location: item.location ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
  };
}

function fromDbActivity(row: Record<string, unknown>): ActivityItem {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    notes: (row.notes as string) || '',
    time: (row.time as string) || '',
    confirmation: (row.confirmation as string) || '',
    cost: (row.cost as number) || 0,
    location: (row.location as string) || undefined,
    lat: (row.lat as number) || undefined,
    lng: (row.lng as number) || undefined,
  };
}

function toDbReservation(item: ReservationItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    date: item.date,
    time: item.time,
    confirmation: item.confirmation,
    notes: item.notes,
    cost: item.cost,
    location: item.location ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
  };
}

function fromDbReservation(row: Record<string, unknown>): ReservationItem {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    date: (row.date as string) || '',
    time: (row.time as string) || '',
    confirmation: (row.confirmation as string) || '',
    notes: (row.notes as string) || '',
    cost: (row.cost as number) || 0,
    location: (row.location as string) || undefined,
    lat: (row.lat as number) || undefined,
    lng: (row.lng as number) || undefined,
  };
}

// ── Hook ────────────────────────────────────────────────────────────────────

export interface ItemCallbacks {
  onAdd: (item: unknown) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
}

const db = supabase as any;

export const useTripData = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [tripData, setTripData] = useState<TripData>(defaultTripData);
  const [transportItems, setTransportItems] = useState<TransportItem[]>([]);
  const [accommodationItems, setAccommodationItems] = useState<AccommodationItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);

  // Refs so debounced callbacks always see current state
  const transportRef = useRef(transportItems);
  const accommodationRef = useRef(accommodationItems);
  const activityRef = useRef(activityItems);
  const reservationRef = useRef(reservationItems);
  useEffect(() => { transportRef.current = transportItems; }, [transportItems]);
  useEffect(() => { accommodationRef.current = accommodationItems; }, [accommodationItems]);
  useEffect(() => { activityRef.current = activityItems; }, [activityItems]);
  useEffect(() => { reservationRef.current = reservationItems; }, [reservationItems]);

  // Debounce timers keyed by item id
  const transportTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const accommodationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const activityTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const reservationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Load all data from Supabase on mount / user change ──
  useEffect(() => {
    if (authLoading) return; // wait for auth to settle
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [profileRes, transportRes, accommodationRes, activityRes, reservationRes, itineraryDaysRes, itineraryActivitiesRes] = await Promise.all([
          db.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          db.from('transport_items').select('*').eq('user_id', user.id),
          db.from('accommodation_items').select('*').eq('user_id', user.id),
          db.from('activity_items').select('*').eq('user_id', user.id),
          db.from('reservation_items').select('*').eq('user_id', user.id),
          db.from('itinerary_days').select('*').eq('user_id', user.id).order('day_number'),
          db.from('itinerary_activities').select('*').eq('user_id', user.id).order('sort_order'),
        ]);

        if (profileRes.error) console.error('[useTripData] profile load error:', profileRes.error);
        if (transportRes.error) console.error('[useTripData] transport load error:', transportRes.error);
        if (accommodationRes.error) console.error('[useTripData] accommodation load error:', accommodationRes.error);
        if (activityRes.error) console.error('[useTripData] activity load error:', activityRes.error);
        if (reservationRes.error) console.error('[useTripData] reservation load error:', reservationRes.error);
        if (itineraryDaysRes.error) console.error('[useTripData] itinerary_days load error:', itineraryDaysRes.error);
        if (itineraryActivitiesRes.error) console.error('[useTripData] itinerary_activities load error:', itineraryActivitiesRes.error);

        const profile = profileRes.data;
        if (profile) {
          setHasProfile(true);
          setTripData({
            destination: profile.destination || '',
            days: profile.days || 7,
            date: profile.trip_date || '',
            names: profile.names || '',
            quote: profile.quote || '"you are my greatest adventure yet"',
            coverImage: profile.cover_image || undefined,
            clockFormat: (profile.clock_format as '12h' | '24h') || '12h',
          });
        }

        if (transportRes.data?.length) setTransportItems(transportRes.data.map(fromDbTransport));
        if (accommodationRes.data?.length) setAccommodationItems(accommodationRes.data.map(fromDbAccommodation));
        if (activityRes.data?.length) setActivityItems(activityRes.data.map(fromDbActivity));
        if (reservationRes.data?.length) setReservationItems(reservationRes.data.map(fromDbReservation));

        if (itineraryDaysRes.data?.length) {
          const allActivities: any[] = itineraryActivitiesRes.data ?? [];
          const loadedDays: ItineraryDay[] = itineraryDaysRes.data.map((row: any): ItineraryDay => ({
            id: row.id,
            dayLabel: row.title || `Day ${row.day_number}`,
            date: row.date || '',
            destination: row.destination || '',
            activities: allActivities
              .filter((a: any) => a.day_id === row.id)
              .map((a: any): ItineraryActivity => ({
                time: a.time || '',
                title: a.title || '',
                location: a.location || '',
                notes: a.notes || '',
                imageUrl: a.image_url || undefined,
                iconType: undefined,
              })),
          }));
          setItineraryDays(loadedDays);
        }
      } catch (err) {
        console.error('[useTripData] unexpected load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  // ── Save profile to Supabase ──
  const saveProfile = useCallback(async (data: TripData) => {
    if (!user) {
      console.error('[saveProfile] called with no user — skipping');
      return;
    }
    const payload = {
      user_id: user.id,
      destination: data.destination || '',
      days: data.days || 7,
      trip_date: data.date || '',
      names: data.names || '',
      quote: data.quote || '"you are my greatest adventure yet"',
      cover_image: data.coverImage ?? null,
      clock_format: data.clockFormat || '12h',
    };
    console.log('[saveProfile] upserting payload:', payload);
    const { error } = await db
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select();
    if (error) {
      console.error('[saveProfile] upsert error:', error);
    } else {
      console.log('[saveProfile] upsert succeeded for user', user.id);
    }
  }, [user]);

  // ── Transport callbacks ──
  const transportCallbacks: ItemCallbacks = {
    onAdd: async (item) => {
      if (!user) { console.warn('[transport] onAdd called with no user — skipping'); return; }
      const payload = toDbTransport(item as TransportItem, user.id);
      console.log('[transport] onAdd — payload keys:', Object.keys(payload));
      console.log('[transport] onAdd — payload:', payload);
      const { data, error } = await db.from('transport_items').insert(payload).select();
      if (error) {
        console.error('[transport] insert error — message:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint);
      } else {
        console.log('[transport] insert success:', data);
      }
    },
    onUpdate: (id: string) => {
      if (!user) { console.warn('[transport] onUpdate called with no user — skipping'); return; }
      const existing = transportTimers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const item = transportRef.current.find(i => i.id === id);
        if (!item) { console.warn('[transport] onUpdate timer fired but item not found in ref for id:', id); return; }
        const payload = toDbTransport(item, user.id);
        console.log('[transport] onUpdate — payload keys:', Object.keys(payload));
        console.log('[transport] onUpdate — payload:', payload);
        const { data, error } = await db.from('transport_items').upsert(payload).select();
        if (error) {
          console.error('[transport] upsert error — message:', error.message, '| code:', error.code, '| details:', error.details, '| hint:', error.hint);
        } else {
          console.log('[transport] upsert success:', data);
        }
      }, 1000);
      transportTimers.current.set(id, timer);
    },
    onDelete: async (id: string) => {
      if (!user) { console.warn('[transport] onDelete called with no user — skipping'); return; }
      const existing = transportTimers.current.get(id);
      if (existing) { clearTimeout(existing); transportTimers.current.delete(id); }
      console.log('[transport] onDelete — deleting id:', id);
      const { error } = await db.from('transport_items').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('[transport] delete error:', error);
      else console.log('[transport] delete success for id:', id);
    },
  };

  // ── Accommodation callbacks ──
  const accommodationCallbacks: ItemCallbacks = {
    onAdd: async (item) => {
      if (!user) return;
      const { error } = await db.from('accommodation_items').insert(toDbAccommodation(item as AccommodationItem, user.id)).select();
      if (error) console.error('[accommodation] insert error:', error);
    },
    onUpdate: (id: string) => {
      if (!user) return;
      const existing = accommodationTimers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const item = accommodationRef.current.find(i => i.id === id);
        if (!item) return;
        const { error } = await db.from('accommodation_items').upsert(toDbAccommodation(item, user.id)).select();
        if (error) console.error('[accommodation] upsert error:', error);
      }, 1000);
      accommodationTimers.current.set(id, timer);
    },
    onDelete: async (id: string) => {
      if (!user) return;
      const existing = accommodationTimers.current.get(id);
      if (existing) { clearTimeout(existing); accommodationTimers.current.delete(id); }
      const { error } = await db.from('accommodation_items').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('[accommodation] delete error:', error);
    },
  };

  // ── Activity callbacks ──
  const activityCallbacks: ItemCallbacks = {
    onAdd: async (item) => {
      if (!user) return;
      const { error } = await db.from('activity_items').insert(toDbActivity(item as ActivityItem, user.id)).select();
      if (error) console.error('[activity] insert error:', error);
    },
    onUpdate: (id: string) => {
      if (!user) return;
      const existing = activityTimers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const item = activityRef.current.find(i => i.id === id);
        if (!item) return;
        const { error } = await db.from('activity_items').upsert(toDbActivity(item, user.id)).select();
        if (error) console.error('[activity] upsert error:', error);
      }, 1000);
      activityTimers.current.set(id, timer);
    },
    onDelete: async (id: string) => {
      if (!user) return;
      const existing = activityTimers.current.get(id);
      if (existing) { clearTimeout(existing); activityTimers.current.delete(id); }
      const { error } = await db.from('activity_items').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('[activity] delete error:', error);
    },
  };

  // ── Reservation callbacks ──
  const reservationCallbacks: ItemCallbacks = {
    onAdd: async (item) => {
      if (!user) return;
      const { error } = await db.from('reservation_items').insert(toDbReservation(item as ReservationItem, user.id)).select();
      if (error) console.error('[reservation] insert error:', error);
    },
    onUpdate: (id: string) => {
      if (!user) return;
      const existing = reservationTimers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const item = reservationRef.current.find(i => i.id === id);
        if (!item) return;
        const { error } = await db.from('reservation_items').upsert(toDbReservation(item, user.id)).select();
        if (error) console.error('[reservation] upsert error:', error);
      }, 1000);
      reservationTimers.current.set(id, timer);
    },
    onDelete: async (id: string) => {
      if (!user) return;
      const existing = reservationTimers.current.get(id);
      if (existing) { clearTimeout(existing); reservationTimers.current.delete(id); }
      const { error } = await db.from('reservation_items').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('[reservation] delete error:', error);
    },
  };

  // ── Itinerary save (delete-then-reinsert on every debounced call) ──
  const saveItineraryDays = useCallback(async (days: ItineraryDay[]) => {
    if (!user) return;
    try {
      // Delete all existing days; CASCADE on FK removes activities too
      const { error: deleteError } = await db.from('itinerary_days').delete().eq('user_id', user.id);
      if (deleteError) { console.error('[saveItineraryDays] delete error:', deleteError); return; }

      if (days.length === 0) return;

      const dayRows = days.map((d, i) => ({
        id: d.id,
        user_id: user.id,
        day_number: i + 1,
        title: d.dayLabel,
        date: d.date,
        destination: d.destination,
      }));
      const { error: daysError } = await db.from('itinerary_days').insert(dayRows);
      if (daysError) { console.error('[saveItineraryDays] days insert error:', daysError); return; }

      const activityRows = days.flatMap((d) =>
        d.activities.map((a, i) => ({
          user_id: user.id,
          day_id: d.id,
          title: a.title || '',
          location: a.location || '',
          time: a.time || '',
          notes: a.notes || '',
          image_url: a.imageUrl ?? null,
          sort_order: i,
        }))
      );
      if (activityRows.length > 0) {
        const { error: actError } = await db.from('itinerary_activities').insert(activityRows);
        if (actError) console.error('[saveItineraryDays] activities insert error:', actError);
      }
    } catch (err) {
      console.error('[saveItineraryDays] unexpected error:', err);
    }
  }, [user]);

  return {
    loading,
    hasProfile,
    tripData,
    setTripData,
    saveProfile,
    transportItems,
    setTransportItems,
    transportCallbacks,
    accommodationItems,
    setAccommodationItems,
    accommodationCallbacks,
    activityItems,
    setActivityItems,
    activityCallbacks,
    reservationItems,
    setReservationItems,
    reservationCallbacks,
    itineraryDays,
    setItineraryDays,
    saveItineraryDays,
  };
};
