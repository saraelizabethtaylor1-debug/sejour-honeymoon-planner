import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Bed, Sparkles, CalendarHeart } from 'lucide-react';
import type { DetailView, TripData, AccommodationItem, ActivityItem, ReservationItem, TransportItem } from '@/types/honeymoon';
import GoogleMap from '@/components/GoogleMap';

interface OverviewTabProps {
  onOpenDetail: (view: DetailView) => void;
  tripData: TripData;
  accommodationItems: AccommodationItem[];
  activityItems: ActivityItem[];
  reservationItems: ReservationItem[];
  transportItems: TransportItem[];
}

type FilterCategory = 'accommodations' | 'activities' | 'reservations' | 'transportation' | null;

type CardItem = { label: string; view: DetailView; icon: typeof Plane; filterKey: FilterCategory };

const groups: { heading: string; cards: CardItem[] }[] = [
  {
    heading: 'Planning',
    cards: [
      { label: 'Transportation', view: 'transportation', icon: Plane, filterKey: 'transportation' },
      { label: 'Accommodations', view: 'accommodations', icon: Bed, filterKey: 'accommodations' },
    ],
  },
  {
    heading: 'Experience',
    cards: [
      { label: 'Activities', view: 'activities', icon: Sparkles, filterKey: 'activities' },
    ],
  },
  {
    heading: 'Logistics',
    cards: [
      { label: 'Reservations', view: 'reservations', icon: CalendarHeart, filterKey: 'reservations' },
    ],
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const OverviewTab = ({ onOpenDetail, tripData, accommodationItems, activityItems, reservationItems, transportItems }: OverviewTabProps) => {
  const quote = tripData.quote?.replace(/^[""]|[""]$/g, '') || 'you are my greatest adventure yet';
  const [activeFilter, setActiveFilter] = useState<FilterCategory>(null);

  const handleCardClick = (itm: CardItem) => {
    if (itm.filterKey) {
      setActiveFilter(prev => prev === itm.filterKey ? null : itm.filterKey);
    }
    onOpenDetail(itm.view);
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 flex flex-col h-full">
      {/* Grid: Cards + Map — fill available height */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr] gap-4 md:gap-5 lg:gap-6 flex-1 min-h-0">
        {/* Left Column — Cards stretch to match map */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-between gap-5 md:gap-0"
        >
          {groups.map((group) => (
            <div key={group.heading} className="flex flex-col gap-2">
              <div>
                <span className="text-[10px] tracking-[0.18em] uppercase font-medium text-foreground/40">{group.heading}</span>
                <hr className="border-foreground/10 mt-1" />
              </div>
              {group.cards.map((itm) => (
                <motion.button
                  key={itm.label}
                  variants={itemVariants}
                  whileHover={{ y: -1, backgroundColor: 'hsl(0 30% 86% / 0.55)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(itm)}
                  className={`w-full flex items-center gap-4 px-5 py-5 md:py-[22px] border rounded-2xl shadow-[0_2px_14px_-4px_hsl(0_16%_43%/0.08)] transition-all duration-200 ${
                    activeFilter === itm.filterKey && itm.filterKey
                      ? 'bg-primary/75 border-primary-foreground/12'
                      : 'bg-primary/55 border-foreground/[0.05]'
                  }`}
                >
                  <itm.icon size={19} strokeWidth={1.1} className="text-primary-foreground/75 shrink-0" />
                  <span className="font-serif text-[15px] md:text-base lg:text-[17px] tracking-wide text-foreground/80">
                    {itm.label}
                  </span>
                </motion.button>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Right Column — Google Map fills height */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="min-h-[280px] overflow-hidden"
          style={{ filter: 'grayscale(80%) brightness(1.05) sepia(20%)', border: '1px solid #E8C8C0', borderRadius: '18px' }}
        >
          <GoogleMap
            destination={tripData.destination}
            accommodations={accommodationItems}
            activities={activityItems}
            reservations={reservationItems}
            transportItems={transportItems}
            activeFilter={activeFilter}
          />
        </motion.div>
      </div>

      {/* Script text — near bottom */}
      <div className="md:grid md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr] md:gap-5 lg:gap-6 py-4 md:py-5">
        <div className="hidden md:block" />
        <p className="font-script text-[26px] md:text-[32px] lg:text-[38px] xl:text-[42px] text-center tracking-tight lowercase leading-tight" style={{ color: 'hsl(0 20% 42%)' }}>
          {quote}
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;
