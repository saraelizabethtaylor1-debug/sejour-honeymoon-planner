import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Bed, Sparkles, CalendarHeart } from 'lucide-react';
import type { DetailView, TripData, AccommodationItem, ActivityItem, ReservationItem, TransportItem } from '@/types/honeymoon';
import { getDaysUntilTrip } from '@/lib/dateUtils';
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

const cards: CardItem[] = [
  { label: 'Transportation', view: 'transportation', icon: Plane, filterKey: 'transportation' },
  { label: 'Accommodations', view: 'accommodations', icon: Bed, filterKey: 'accommodations' },
  { label: 'Activities', view: 'activities', icon: Sparkles, filterKey: 'activities' },
  { label: 'Reservations', view: 'reservations', icon: CalendarHeart, filterKey: 'reservations' },
];

const OverviewTab = ({ onOpenDetail, tripData, accommodationItems, activityItems, reservationItems, transportItems }: OverviewTabProps) => {
  const quote = tripData.quote?.replace(/^[""]|[""]$/g, '') || 'you are my greatest adventure yet';
  const [activeFilter, setActiveFilter] = useState<FilterCategory>(null);
  const countdown = getDaysUntilTrip(tripData.date);

  const handleCardClick = (itm: CardItem) => {
    if (itm.filterKey) {
      setActiveFilter(prev => prev === itm.filterKey ? null : itm.filterKey);
    }
    onOpenDetail(itm.view);
  };

  const heroLine = [tripData.destination, countdown].filter(Boolean).join(' · ');

  return (
    <div className="w-full flex flex-col h-full">
      {/* Slim Hero Band */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-4 px-4"
      >
        {heroLine && (
          <p className="font-serif text-[11px] uppercase tracking-[0.28em] text-foreground/40 font-light">
            {heroLine}
          </p>
        )}
        <p
          className="mt-1.5 font-script text-[24px] tracking-tight lowercase leading-[1.2]"
          style={{ color: 'hsl(10 30% 35%)' }}
        >
          {quote}
        </p>
      </motion.div>

      {/* Two-column layout — centered 900px container */}
      <div className="flex-1 min-h-0 flex justify-center px-4 pb-6">
        <div className="w-full" style={{ maxWidth: '900px' }}>
          <div className="grid h-full gap-6" style={{ gridTemplateColumns: '45% 55%' }}>
            {/* Left — Category Cards */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
              className="flex flex-col gap-3"
            >
              {cards.map((itm) => (
                <motion.button
                  key={itm.label}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -2, boxShadow: '0 6px 24px -6px hsl(10 16% 40% / 0.12)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(itm)}
                  className={`w-full flex items-center gap-5 px-6 py-6 border rounded-2xl transition-all duration-200 ${
                    activeFilter === itm.filterKey && itm.filterKey
                      ? 'bg-primary/75 border-primary-foreground/12 shadow-md'
                      : 'bg-primary/40 border-foreground/[0.04] shadow-[0_2px_12px_-4px_hsl(10_16%_40%/0.06)]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
                    <itm.icon size={20} strokeWidth={1.2} className="text-foreground/50" />
                  </div>
                  <span className="font-serif text-[15px] md:text-base lg:text-[17px] tracking-wide text-foreground/80">
                    {itm.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            {/* Right — Google Map (constrained to column) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="overflow-hidden"
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
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
