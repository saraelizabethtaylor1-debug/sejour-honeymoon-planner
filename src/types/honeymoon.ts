export interface TripData {
  destination: string;
  days: number;
  date: string;
  names: string;
  quote: string;
  coverImage?: string;
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
}

export interface TransportItem {
  id: string;
  type: string;
  details: string;
  confirmation: string;
  time: string;
}

export interface AccommodationItem {
  id: string;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  confirmation: string;
}

export interface ActivityItem {
  id: string;
  name: string;
  notes: string;
  time: string;
}

export interface ReservationItem {
  id: string;
  name: string;
  date: string;
  time: string;
  confirmation: string;
  notes: string;
}

export interface ItineraryActivity {
  time: string;
  title: string;
  location: string;
  notes: string;
}

export interface ItineraryDay {
  id: string;
  dayLabel: string;
  destination: string;
  activities: ItineraryActivity[];
}

export type AppView = 'welcome' | 'home' | 'dashboard';
export type DashboardTab = 'planning' | 'overview' | 'itinerary';
export type DetailView = 'todos' | 'budget' | 'packing' | 'transportation' | 'accommodations' | 'activities' | 'reservations' | 'map' | null;
