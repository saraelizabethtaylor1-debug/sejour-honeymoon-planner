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

type CardSection = { header: string; cards: CardItem[] };

const sections: CardSection[] = [
  {
    header: 'PLANNING',
    cards: [
      { label: 'Transportation', view: 'transportation', icon: Plane, filterKey: 'transportation' },
      { label: 'Accommodations', view: 'accommodations', icon: Bed, filterKey: 'accommodations' },
    ],
  },
  {
    header: 'EXPERIENCE',
    cards: [
      { label: 'Activities', view: 'activities', icon: Sparkles, filterKey: 'activities' },
    ],
  },
  {
    header: 'LOGISTICS',
    cards: [
      { label: 'Reservations', view: 'reservations', icon: CalendarHeart, filterKey: 'reservations' },
    ],
  },
];

const CARD_HEIGHT = 100;
const CARD_GAP = 12;
const SECTION_HEADER_HEIGHT = 16; // approximate line height of small caps header
const SECTION_HEADER_MB = 8;
const SECTION_MT = 20;

// Calculate total left column height:
// Section 1: header(16) + mb(8) + card(100) + gap(12) + card(100)
// Section 2: mt(20) + header(16) + mb(8) + card(100)
// Section 3: mt(20) + header(16) + mb(8) + card(100)
// = 16+8+100+12+100 + 20+16+8+100 + 20+16+8+100 = 524
const TOTAL_LEFT_HEIGHT = (SECTION_HEADER_HEIGHT + SECTION_HEADER_MB + CARD_HEIGHT * 2 + CARD_GAP)
  + (SECTION_MT + SECTION_HEADER_HEIGHT + SECTION_HEADER_MB + CARD_HEIGHT)
  + (SECTION_MT + SECTION_HEADER_HEIGHT + SECTION_HEADER_MB + CARD_HEIGHT);

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
      {/* Slim Hero — no quote */}
      <div className="text-center" style={{ paddingTop: 12, paddingBottom: 20 }}>
        {heroLine && (
          <p className="font-serif uppercase tracking-[0.28em] text-foreground/40 font-light px-0 py-[50px] pt-[50px] pb-0 text-lg">
            {heroLine}
          </p>
        )}
      </div>

      {/* Two-column layout — 1100px centered */}
      <div className="flex justify-center px-[7px]" style={{ paddingTop: 60, paddingBottom: 0 }}>
        <div style={{ width: '100%', maxWidth: 1100 }}>
          <div className="flex" style={{ gap: 24 }}>
            {/* Left — Grouped cards at 420px */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              className="flex flex-col shrink-0"
              style={{ width: 420 }}
            >
              {sections.map((section, sIdx) => (
                <div key={section.header} style={{ marginTop: sIdx === 0 ? 0 : SECTION_MT }}>
                  {/* Section header */}
                  <motion.p
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                    className="uppercase tracking-[0.22em] text-foreground/35 font-light text-sm font-sans"
                    style={{ fontSize: 11, marginBottom: SECTION_HEADER_MB, lineHeight: `${SECTION_HEADER_HEIGHT}px` }}
                  >
                    {section.header}
                  </motion.p>

                  {/* Cards */}
                  <div className="flex flex-col" style={{ gap: CARD_GAP }}>
                    {section.cards.map((itm) => (
                      <motion.button
                        key={itm.label}
                        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                        whileHover={{ y: -2, boxShadow: '0 6px 24px -6px hsl(10 16% 40% / 0.12)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCardClick(itm)}
                        className={`w-full flex items-center gap-4 px-5 border rounded-xl transition-all duration-200 ${
                          activeFilter === itm.filterKey && itm.filterKey
                            ? 'bg-primary/75 border-primary-foreground/12 shadow-md'
                            : 'bg-primary/40 border-foreground/[0.04] shadow-[0_2px_12px_-4px_hsl(10_16%_40%/0.06)]'
                        }`}
                        style={{ height: CARD_HEIGHT }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
                          <itm.icon size={20} strokeWidth={1.2} className="text-foreground/50" />
                        </div>
                        <span className="font-serif tracking-wide text-foreground/80 text-base">
                          {itm.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Right — Map fills remaining width, matches left column height */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex-1 min-w-0 overflow-hidden"
              style={{
                height: TOTAL_LEFT_HEIGHT,
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

      {/* Romantic sign-off quote */}
      <div className="text-center" style={{ marginTop: 48, marginBottom: 60 }}>
        <p
          className="font-script italic lowercase leading-[1.2]"
          style={{ color: 'hsl(10 30% 35%)', fontSize: 26 }}
        >
          {quote}
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;
