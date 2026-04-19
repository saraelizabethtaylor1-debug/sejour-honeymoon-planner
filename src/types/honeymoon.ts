export interface TripData {
  destination: string;
  days: number;
  date: string;
  names: string;
  quote: string;
  coverImage?: string;
  clockFormat?: '12h' | '24h';
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface BudgetItem {
  id: string;
  category: string;
  estimated: number;
  actual: number;
}

export interface PackingItem {
  id: string;
  text: string;
  packed: boolean;
  traveler?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface TransportItem {
  id: string;
  type: string;
  details: string;
  confirmation: string;
  date?: string;
  time: string;
  cost: number;
  departureLocation?: string;
  departureLat?: number;
  departureLng?: number;
  arrivalLocation?: string;
  arrivalLat?: number;
  arrivalLng?: number;
  location?: string;
  lat?: number;
  lng?: number;
  takeoffDate?: string;
  takeoffTime?: string;
  landingDate?: string;
  landingTime?: string;
}

export interface AccommodationItem {
  id: string;
  name: string;
  address: string;
  checkIn: string;
  checkInTime: string;
  checkOut: string;
  checkOutTime: string;
  confirmation: string;
  cost: number;
  lat?: number;
  lng?: number;
}

export interface ActivityItem {
  id: string;
  name: string;
  notes: string;
  time: string;
  confirmation: string;
  cost: number;
  location?: string;
  lat?: number;
  lng?: number;
}

export interface ReservationItem {
  id: string;
  name: string;
  date: string;
  time: string;
  confirmation: string;
  notes: string;
  cost: number;
  location?: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryActivity {
  time: string;
  title: string;
  location: string;
  notes: string;
  imageUrl?: string;
  iconType?: 'hotel' | 'flight' | 'dining' | 'activity' | 'spa' | 'beach' | 'sightseeing' | 'transport' | 'default';
}

export interface ItineraryDay {
  id: string;
  dayLabel: string;
  date: string;
  destination: string;
  activities: ItineraryActivity[];
}

export interface TravelerInfo {
  id: string;
  name: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  nationality: string;
  dietaryRestrictions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  preferredAirline: string;
  seatPreference: string;
  notes: string;
}

export type AppView = 'welcome' | 'home' | 'dashboard';
export type DashboardTab = 'planning' | 'overview' | 'itinerary';
export type DetailView = 'todos' | 'budget' | 'packing' | 'notes' | 'transportation' | 'accommodations' | 'activities' | 'reservations' | 'map' | 'travelerInfo' | 'concierge' | null;
