import { motion } from 'framer-motion';
import { Plane, Hotel, Sparkles, CalendarHeart } from 'lucide-react';
import type { DetailView, TripData } from '@/types/honeymoon';

interface OverviewTabProps {
  onOpenDetail: (view: DetailView) => void;
  tripData: TripData;
}

const items: { label: string; view: DetailView; icon: typeof Plane }[] = [
  { label: 'Transportation', view: 'transportation', icon: Plane },
  { label: 'Accommodations', view: 'accommodations', icon: Hotel },
  { label: 'Activities', view: 'activities', icon: Sparkles },
  { label: 'Reservations', view: 'reservations', icon: CalendarHeart },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const OverviewTab = ({ onOpenDetail, tripData }: OverviewTabProps) => {
  const quote = tripData.quote?.replace(/^[""]|[""]$/g, '') || 'you are my greatest adventure yet';

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* Grid: Cards + Map (same height) */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-5 md:gap-6 lg:gap-10 xl:gap-14 items-stretch">
        {/* Left Column — Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-between"
        >
          {items.map((itm) => (
            <motion.button
              key={itm.label}
              variants={item}
              whileHover={{ y: -1, backgroundColor: 'hsl(0 30% 88% / 0.5)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenDetail(itm.view)}
              className="w-full flex items-center gap-4 px-6 py-5 md:py-6 bg-primary/50 border border-foreground/[0.04] rounded-2xl shadow-[0_2px_12px_-4px_hsl(0_16%_43%/0.06)] transition-all duration-200"
            >
              <itm.icon size={20} strokeWidth={1.1} className="text-primary-foreground/60 shrink-0" />
              <span className="font-serif text-base md:text-[17px] lg:text-lg tracking-wide text-foreground/70">
                {itm.label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Right Column — Map only */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="min-h-[240px] md:min-h-0"
        >
          <button
            onClick={() => onOpenDetail('map')}
            className="w-full h-full rounded-2xl overflow-hidden bg-accent/40 border border-border relative group cursor-pointer"
          >
            <svg
              viewBox="0 0 800 500"
              className="w-full h-full text-primary-foreground/20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 70} y1="0" x2={i * 70} y2="500" stroke="currentColor" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 70} x2="800" y2={i * 70} stroke="currentColor" strokeWidth="0.5" />
              ))}
              <path d="M100 350 Q200 300 280 320 Q380 350 420 280 Q480 200 560 230 Q640 260 700 200" stroke="currentColor" strokeWidth="1" />
              <path d="M50 400 Q180 340 300 360 Q420 390 500 300 Q580 220 680 250 Q740 270 800 220" stroke="currentColor" strokeWidth="0.8" />
              <path d="M150 280 Q240 240 340 260 Q440 290 520 220 Q580 170 660 180" stroke="currentColor" strokeWidth="0.8" />
              <path d="M200 200 Q300 160 400 180 Q480 200 540 160 Q600 120 700 140" stroke="currentColor" strokeWidth="0.6" />
              <path d="M120 380 Q300 200 500 250 Q650 290 750 180" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 6" />
              <circle cx="180" cy="330" r="4" fill="currentColor" opacity="0.4" />
              <circle cx="420" cy="270" r="4" fill="currentColor" opacity="0.4" />
              <circle cx="600" cy="230" r="4" fill="currentColor" opacity="0.4" />
              <circle cx="700" cy="190" r="4" fill="currentColor" opacity="0.4" />
              <circle cx="300" cy="300" r="3" fill="currentColor" opacity="0.3" />
              <circle cx="520" cy="240" r="3" fill="currentColor" opacity="0.3" />
            </svg>
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.02] transition-colors duration-300" />
          </button>
        </motion.div>
      </div>

      {/* Script text — below grid, centered to map on desktop */}
      <div className="md:grid md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] md:gap-6 lg:gap-10 xl:gap-14">
        <div className="hidden md:block" />
        <p className="font-script text-2xl md:text-3xl lg:text-[36px] xl:text-[42px] text-foreground/40 text-center tracking-tight lowercase leading-tight">
          {quote}
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;
