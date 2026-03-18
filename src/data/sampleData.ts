import type { TripData, TodoItem, BudgetItem, PackingItem, NoteItem, TransportItem, AccommodationItem, ActivityItem, ReservationItem, ItineraryDay } from '@/types/honeymoon';

export const defaultTripData: TripData = {
  destination: 'Santorini & Mykonos',
  days: 12,
  date: 'Sept 14, 2025',
  names: 'Elena & Julian',
  quote: '"You are my greatest adventure yet"',
};

export const sampleTodos: TodoItem[] = [
  { id: '1', text: 'Book flights to Athens', completed: true },
  { id: '2', text: 'Reserve hotel in Oia', completed: true },
  { id: '3', text: 'Purchase travel insurance', completed: false },
  { id: '4', text: 'Get passport photos', completed: false },
  { id: '5', text: 'Book sunset catamaran cruise', completed: false },
  { id: '6', text: 'Make dinner reservations', completed: false },
];

export const sampleBudget: BudgetItem[] = [
  { id: '1', category: 'Flights', estimated: 2400, actual: 2280 },
  { id: '2', category: 'Accommodations', estimated: 4500, actual: 4200 },
  { id: '3', category: 'Activities', estimated: 1200, actual: 800 },
  { id: '4', category: 'Dining', estimated: 1500, actual: 0 },
  { id: '5', category: 'Transportation', estimated: 600, actual: 350 },
  { id: '6', category: 'Shopping', estimated: 800, actual: 0 },
];

export const samplePacking: PackingItem[] = [
  { id: '1', text: 'Passports & travel docs', packed: true },
  { id: '2', text: 'Sunscreen SPF 50', packed: true },
  { id: '3', text: 'White linen dress', packed: false },
  { id: '4', text: 'Swimsuits (3)', packed: false },
  { id: '5', text: 'Sandals & walking shoes', packed: false },
  { id: '6', text: 'Camera & charger', packed: false },
  { id: '7', text: 'Evening wear', packed: false },
];

export const sampleNotes: NoteItem[] = [
  { id: '1', title: 'Packing Tips', content: 'Pack light layers — Santorini evenings can be breezy. Bring a shawl for dinner.', createdAt: 'Mar 10' },
  { id: '2', title: 'Restaurant Recs', content: 'Local recommended: Argo in Fira, Sunset Ammoudi for fresh fish.', createdAt: 'Mar 12' },
];

export const sampleTransport: TransportItem[] = [
  { id: '1', type: 'Flight', details: 'NYC → Athens (Delta DL412)', confirmation: 'DL8829', time: 'Sept 14, 10:30 PM', cost: 1800 },
  { id: '2', type: 'Flight', details: 'Athens → Santorini (Aegean A3354)', confirmation: 'AE2241', time: 'Sept 15, 2:15 PM', cost: 280 },
  { id: '3', type: 'Ferry', details: 'Santorini → Mykonos (SeaJets)', confirmation: 'SJ7712', time: 'Sept 20, 9:00 AM', cost: 200 },
];

export const sampleAccommodations: AccommodationItem[] = [
  { id: '1', name: 'Canaves Oia Suites', address: 'Oia, Santorini', checkIn: 'Sept 15', checkOut: 'Sept 20', confirmation: 'CNV-88291', cost: 2800 },
  { id: '2', name: 'Cavo Tagoo Mykonos', address: 'Tagoo, Mykonos', checkIn: 'Sept 20', checkOut: 'Sept 25', confirmation: 'CTV-44102', cost: 1400 },
];

export const sampleActivities: ActivityItem[] = [
  { id: '1', name: 'Sunset Catamaran Cruise', notes: 'BBQ dinner included, bring swimsuit', time: 'Sept 16, 4:00 PM', confirmation: 'CAT-301', cost: 350 },
  { id: '2', name: 'Wine Tasting in Pyrgos', notes: 'Santo Wines Winery, 4 varietals', time: 'Sept 17, 11:00 AM', confirmation: 'SW-112', cost: 120 },
  { id: '3', name: 'Couples Spa at Canaves', notes: 'Deep tissue + aromatherapy', time: 'Sept 18, 10:00 AM', confirmation: 'SPA-455', cost: 280 },
  { id: '4', name: 'Delos Island Day Trip', notes: 'Ferry from Mykonos Old Port', time: 'Sept 22, 8:30 AM', confirmation: 'DEL-778', cost: 50 },
];

export const sampleReservations: ReservationItem[] = [
  { id: '1', name: 'Ambrosia Restaurant', date: 'Sept 16', time: '7:30 PM', confirmation: 'AMB-221', notes: 'Cliffside table for 2', cost: 0 },
  { id: '2', name: 'Lycabettus Restaurant', date: 'Sept 17', time: '8:00 PM', confirmation: 'LYC-445', notes: 'Tasting menu requested', cost: 0 },
  { id: '3', name: 'Nammos Beach Club', date: 'Sept 21', time: '12:00 PM', confirmation: 'NMM-882', notes: 'Sunbed reservation', cost: 0 },
];

export const sampleItinerary: ItineraryDay[] = [
  {
    id: '1', dayLabel: 'Day 1', date: 'Sept 15', destination: 'Arrival in Oia',
    activities: [
      { time: '2:00 PM', title: 'Check-in at Canaves Oia', location: 'Oia, Santorini', notes: 'Confirmation: #CNV-88291' },
      { time: '5:00 PM', title: 'Explore Oia Village', location: 'Oia', notes: 'Walk to the castle ruins for sunset' },
      { time: '7:30 PM', title: 'Dinner at Ambrosia', location: 'Oia', notes: 'Table for 2, cliffside' },
    ],
  },
  {
    id: '2', dayLabel: 'Day 2', date: 'Sept 16', destination: 'Sailing the Caldera',
    activities: [
      { time: '9:00 AM', title: 'Breakfast on the terrace', location: 'Canaves Oia', notes: '' },
      { time: '4:00 PM', title: 'Sunset Catamaran Cruise', location: 'Vlychada Port', notes: 'Pickup from hotel lobby' },
    ],
  },
  {
    id: '3', dayLabel: 'Day 3', date: 'Sept 17', destination: 'Pyrgos & Wine Country',
    activities: [
      { time: '11:00 AM', title: 'Wine Tasting at Santo Wines', location: 'Pyrgos', notes: '4 varietal tasting' },
      { time: '1:00 PM', title: 'Lunch in Pyrgos village', location: 'Pyrgos', notes: '' },
    ],
  },
  {
    id: '4', dayLabel: 'Day 4', date: 'Sept 18', destination: 'Spa & Relaxation',
    activities: [
      { time: '10:00 AM', title: 'Couples Spa Treatment', location: 'Canaves Spa', notes: 'Deep tissue + aromatherapy' },
      { time: '2:00 PM', title: 'Pool day', location: 'Canaves Oia', notes: '' },
    ],
  },
  {
    id: '5', dayLabel: 'Day 5', date: 'Sept 19', destination: 'Red Beach & Akrotiri',
    activities: [
      { time: '9:00 AM', title: 'Visit Akrotiri Archaeological Site', location: 'Akrotiri', notes: '' },
      { time: '12:00 PM', title: 'Red Beach', location: 'Akrotiri', notes: 'Bring water shoes' },
    ],
  },
];
