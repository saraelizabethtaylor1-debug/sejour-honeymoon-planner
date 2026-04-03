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

const CARD_HEIGHT = 68;
const CARD_GAP = 12;
const TOTAL_HEIGHT = CARD_HEIGHT * 4 + CARD_GAP * 3; // 308px

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
      {/* Slim Hero */}
      <div className="text-center" style={{ paddingTop: 12, paddingBottom: 20 }}>
        {heroLine && (
          <p className="font-serif uppercase tracking-[0.28em] text-foreground/40 font-light text-xl">
            {heroLine}
          </p>
        )}
        <p
          className="font-script italic lowercase leading-[1.2] text-4xl"
          style={{ color: 'hsl(10 30% 35%)', marginTop: 8 }}
        >
          {quote}
        </p>
      </div>

      {/* Two-column layout — 1000px centered */}
      <div className="flex justify-center px-4 pb-6">
        <div style={{ width: '100%', maxWidth: 920 }}>
          <div className="flex" style={{ gap: 20 }}>
            {/* Left — Cards at 340px */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
              className="flex flex-col shrink-0"
              style={{ width: 340, gap: CARD_GAP }}
            >
              {cards.map((itm) => (
                <motion.button
                  key={itm.label}
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -2, boxShadow: '0 6px 24px -6px hsl(10 16% 40% / 0.12)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(itm)}
                  className={`w-full flex items-center gap-4 px-4 border rounded-xl transition-all duration-200 ${
                    activeFilter === itm.filterKey && itm.filterKey
                      ? 'bg-primary/75 border-primary-foreground/12 shadow-md'
                      : 'bg-primary/40 border-foreground/[0.04] shadow-[0_2px_12px_-4px_hsl(10_16%_40%/0.06)]'
                  }`}
                  style={{ height: CARD_HEIGHT }}
                >
                  <div className="w-9 h-9 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
                    <itm.icon size={18} strokeWidth={1.2} className="text-foreground/50" />
                  </div>
                  <span className="font-serif tracking-wide text-foreground/80 text-sm">
                    {itm.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>

            {/* Right — Map fills remaining ~560px, height matches cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex-1 min-w-0 overflow-hidden"
              style={{
                height: TOTAL_HEIGHT,
                maxWidth: 560,
                filter: 'grayscale(80%) brightness(1.05) sepia(20%)',
                border: '1px solid #E8C8C0',
                borderRadius: 12,
              }}
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
