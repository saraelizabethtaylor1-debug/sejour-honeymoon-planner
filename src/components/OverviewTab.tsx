import { motion } from 'framer-motion';
import { Plane, Bed, Map, CalendarHeart } from 'lucide-react';
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

type RowItem = { label: string; view: DetailView; icon: typeof Plane };

const tripRows: RowItem[] = [
  { label: 'Transportation', view: 'transportation', icon: Plane },
  { label: 'Accommodations', view: 'accommodations', icon: Bed },
  { label: 'Activities', view: 'activities', icon: Map },
  { label: 'Reservations', view: 'reservations', icon: CalendarHeart },
];


const OverviewTab = ({ onOpenDetail, tripData, accommodationItems, activityItems, reservationItems, transportItems }: OverviewTabProps) => {
  const quote = tripData.quote?.replace(/^[""]|[""]$/g, '') || 'you are my greatest adventure yet';
  const countdown = getDaysUntilTrip(tripData.date);

  return (
    <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 165px)' }}>

      {/* Hero bar — full-width dusty rose */}
      <div className="w-full bg-primary/20 flex-shrink-0 flex flex-col items-center justify-center" style={{ paddingTop: 22, paddingBottom: 22 }}>
        {tripData.destination && (
          <h1
            className="font-serif text-foreground/75"
            style={{ fontSize: 17, letterSpacing: '0.38em', textTransform: 'uppercase', fontWeight: 400 }}
          >
            {tripData.destination}
          </h1>
        )}
        {countdown && (
          <p className="font-body text-[10px] uppercase tracking-widest mt-1.5" style={{ color: 'hsl(0 12% 50%)' }}>
            {countdown.toUpperCase()}
          </p>
        )}
      </div>
      <div className="w-full border-b border-foreground/10 flex-shrink-0" />

      {/* Two-column layout */}
      <div className="flex-1 min-h-0 flex px-6 pt-5 pb-4" style={{ gap: 40, maxWidth: 1100, alignSelf: 'center', width: '100%' }}>

        {/* Left column — concierge menu rows */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="flex flex-col"
          style={{ width: 320, flexShrink: 0 }}
        >
          {tripRows.map((row, idx) => (
            <motion.button
              key={row.view}
              variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0 } }}
              whileHover="hover"
              onClick={() => onOpenDetail(row.view)}
              className="group w-full flex items-center gap-3.5 text-left transition-colors"
              style={{ paddingTop: 13, paddingBottom: 13, borderTop: idx === 0 ? '1px solid hsl(0 12% 88%)' : undefined, borderBottom: '1px solid hsl(0 12% 88%)' }}
            >
              <motion.div
                variants={{ hover: { x: 2 } }}
                transition={{ type: 'tween', duration: 0.15 }}
                className="flex items-center gap-3.5 w-full"
              >
                <row.icon
                  size={14}
                  strokeWidth={1.3}
                  className="text-foreground/35 group-hover:text-foreground/60 transition-colors flex-shrink-0"
                />
                <span
                  className="font-serif text-foreground/65 group-hover:text-foreground/90 transition-colors"
                  style={{ fontSize: 15, fontWeight: 400, letterSpacing: '0.01em' }}
                >
                  {row.label}
                </span>
              </motion.div>
            </motion.button>
          ))}

          {/* Quote */}
          <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ gap: 2, minHeight: 0 }}>
            <span
              className="font-serif uppercase block"
              style={{ fontSize: 14, letterSpacing: '0.3em', fontWeight: 300, color: 'hsl(0 12% 52%)' }}
            >
              <span style={{ color: 'hsl(0 20% 62%)', marginRight: 4 }}>&ldquo;</span>you are my
            </span>
            <span
              className="font-serif uppercase block"
              style={{ fontSize: 14, letterSpacing: '0.3em', fontWeight: 300, color: 'hsl(0 12% 52%)' }}
            >
              greatest
            </span>
            <span
              className="font-script block"
              style={{ fontSize: '2.25rem', color: 'hsl(0 20% 32%)', lineHeight: 1.15 }}
            >
              adventure
            </span>
            <span
              className="font-serif uppercase block"
              style={{ fontSize: 14, letterSpacing: '0.3em', fontWeight: 300, color: 'hsl(0 12% 52%)' }}
            >
              yet<span style={{ color: 'hsl(0 20% 62%)', marginLeft: 4 }}>&rdquo;</span>
            </span>
          </div>
        </motion.div>

        {/* Right column — map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex-1 min-w-0 overflow-hidden"
          style={{
            filter: 'grayscale(80%) brightness(1.05) sepia(20%)',
            border: '1px solid hsl(0 20% 86%)',
            borderRadius: 8,
          }}
        >
          <GoogleMap
            destination={tripData.destination}
            accommodations={accommodationItems}
            activities={activityItems}
            reservations={reservationItems}
            transportItems={transportItems}
            activeFilter={null}
          />
        </motion.div>

      </div>
    </div>
  );
};

export default OverviewTab;
