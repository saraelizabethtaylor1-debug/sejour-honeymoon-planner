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
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-5 md:gap-6 lg:gap-10 xl:gap-14 items-start">
      {/* Left Column — Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-2.5 md:gap-3"
      >
        {items.map((itm) => (
          <motion.button
            key={itm.label}
            variants={item}
            whileHover={{ y: -1, backgroundColor: 'hsl(0 30% 88% / 0.5)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenDetail(itm.view)}
            className="w-full flex items-center gap-4 px-5 py-4 md:py-[18px] bg-primary/40 rounded-2xl transition-all duration-200"
          >
            <itm.icon size={20} strokeWidth={1.1} className="text-primary-foreground/70 shrink-0" />
            <span className="font-serif text-base md:text-[17px] lg:text-lg tracking-wide text-foreground/80">
              {itm.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Right Column — Map + Script */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="flex flex-col items-center"
      >
        {/* Map placeholder */}
        <button
          onClick={() => onOpenDetail('map')}
          className="w-full rounded-2xl overflow-hidden bg-accent/40 border border-border relative group cursor-pointer"
          style={{ aspectRatio: '16 / 10' }}
        >
          {/* Topographic-style decorative SVG */}
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full text-primary-foreground/20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid lines */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 70} y1="0" x2={i * 70} y2="500" stroke="currentColor" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 70} x2="800" y2={i * 70} stroke="currentColor" strokeWidth="0.5" />
            ))}
            {/* Topographic contours */}
            <path d="M100 350 Q200 300 280 320 Q380 350 420 280 Q480 200 560 230 Q640 260 700 200" stroke="currentColor" strokeWidth="1" />
            <path d="M50 400 Q180 340 300 360 Q420 390 500 300 Q580 220 680 250 Q740 270 800 220" stroke="currentColor" strokeWidth="0.8" />
            <path d="M150 280 Q240 240 340 260 Q440 290 520 220 Q580 170 660 180" stroke="currentColor" strokeWidth="0.8" />
            <path d="M200 200 Q300 160 400 180 Q480 200 540 160 Q600 120 700 140" stroke="currentColor" strokeWidth="0.6" />
            {/* Dashed route line */}
            <path d="M120 380 Q300 200 500 250 Q650 290 750 180" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 6" />
            {/* Location dots */}
            <circle cx="180" cy="330" r="4" fill="currentColor" opacity="0.4" />
            <circle cx="420" cy="270" r="4" fill="currentColor" opacity="0.4" />
            <circle cx="600" cy="230" r="4" fill="currentColor" opacity="0.4" />
            <circle cx="700" cy="190" r="4" fill="currentColor" opacity="0.4" />
            <circle cx="300" cy="300" r="3" fill="currentColor" opacity="0.3" />
            <circle cx="520" cy="240" r="3" fill="currentColor" opacity="0.3" />
          </svg>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.02] transition-colors duration-300" />
        </button>

        {/* Script text */}
        <p className="font-script text-xl md:text-2xl lg:text-[28px] xl:text-[32px] text-foreground/35 mt-4 md:mt-5 text-center tracking-tight lowercase">
          {quote}
        </p>
      </motion.div>
    </div>
  );
};

export default OverviewTab;
