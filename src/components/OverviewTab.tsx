import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Hotel, Sparkles, CalendarHeart } from 'lucide-react';
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

const items: { label: string; view: DetailView; icon: typeof Plane; filterKey: FilterCategory }[] = [
  { label: 'Transportation', view: 'transportation', icon: Plane, filterKey: 'transportation' as FilterCategory },
  { label: 'Accommodations', view: 'accommodations', icon: Hotel, filterKey: 'accommodations' },
  { label: 'Activities', view: 'activities', icon: Sparkles, filterKey: 'activities' },
  { label: 'Reservations', view: 'reservations', icon: CalendarHeart, filterKey: 'reservations' },
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

  const handleCardClick = (itm: typeof items[0]) => {
    // Toggle filter on the map
    if (itm.filterKey) {
      setActiveFilter(prev => prev === itm.filterKey ? null : itm.filterKey);
    }
    // Also open the detail view
    onOpenDetail(itm.view);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 flex flex-col gap-4 md:gap-5">
      {/* Grid: Cards + Map (same height) */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] gap-5 md:gap-6 lg:gap-7 xl:gap-8">
        {/* Left Column — Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-between gap-5 md:gap-4 md:h-[380px] lg:h-[420px] xl:h-[450px]"
        >
          {items.map((itm) => (
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
        </motion.div>

        {/* Right Column — Google Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="min-h-[280px] md:h-[380px] lg:h-[420px] xl:h-[450px] rounded-2xl overflow-hidden border border-border"
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

      {/* Script text — below grid, centered to map on desktop */}
      <div className="md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] md:gap-6 lg:gap-7 xl:gap-8">
        <div className="hidden md:block" />
        <p className="font-script text-[26px] md:text-[32px] lg:text-[38px] xl:text-[42px] text-foreground/60 text-center tracking-tight lowercase leading-tight">
          {quote}
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;
