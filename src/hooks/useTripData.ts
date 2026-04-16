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
} from '@/types/honeymoon';

// ── Column mappers ──────────────────────────────────────────────────────────

function toDbTransport(item: TransportItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    type: item.type,
    details: item.details,
    confirmation: item.confirmation,
    date: item.date || '',
    time: item.time,
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
  };
}

function fromDbTransport(row: Record<string, unknown>): TransportItem {
  return {
    id: row.id as string,
    type: (row.type as string) || '',
    details: (row.details as string) || '',
    confirmation: (row.confirmation as string) || '',
    date: (row.date as string) || '',
    time: (row.time as string) || '',
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
        const [profileRes, transportRes, accommodationRes, activityRes, reservationRes] = await Promise.all([
          db.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          db.from('transport_items').select('*').eq('user_id', user.id),
          db.from('accommodation_items').select('*').eq('user_id', user.id),
          db.from('activity_items').select('*').eq('user_id', user.id),
          db.from('reservation_items').select('*').eq('user_id', user.id),
        ]);

        if (profileRes.error) console.error('[useTripData] profile load error:', profileRes.error);
        if (transportRes.error) console.error('[useTripData] transport load error:', transportRes.error);
        if (accommodationRes.error) console.error('[useTripData] accommodation load error:', accommodationRes.error);
        if (activityRes.error) console.error('[useTripData] activity load error:', activityRes.error);
        if (reservationRes.error) console.error('[useTripData] reservation load error:', reservationRes.error);

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
      if (!user) return;
      const { error } = await db.from('transport_items').insert(toDbTransport(item as TransportItem, user.id)).select();
      if (error) console.error('[transport] insert error:', error);
    },
    onUpdate: (id: string) => {
      if (!user) return;
      const existing = transportTimers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        const item = transportRef.current.find(i => i.id === id);
        if (!item) return;
        const { error } = await db.from('transport_items').upsert(toDbTransport(item, user.id)).select();
        if (error) console.error('[transport] upsert error:', error);
      }, 1000);
      transportTimers.current.set(id, timer);
    },
    onDelete: async (id: string) => {
      if (!user) return;
      const existing = transportTimers.current.get(id);
      if (existing) { clearTimeout(existing); transportTimers.current.delete(id); }
      const { error } = await db.from('transport_items').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('[transport] delete error:', error);
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
  };
};
