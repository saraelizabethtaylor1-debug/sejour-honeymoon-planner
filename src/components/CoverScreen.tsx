import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TripData } from '@/types/honeymoon';
import santoriniCover from '@/assets/santorini-cover.jpg';

interface CoverScreenProps {
  tripData: TripData;
  onEnter: () => void;
}

const CoverScreen = ({ tripData, onEnter }: CoverScreenProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen relative flex flex-col items-center justify-between py-16 px-8 text-center bg-subtle-gradient"
    >
      <p className="text-label">Honeymoon Planner</p>

      <div className="flex flex-col items-center gap-6 w-full">
        <h2 className="font-script text-5xl text-primary-foreground leading-none">
          {tripData.destination.split(' ')[0] || 'Greece'}
        </h2>

        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="w-full max-w-[300px] aspect-[3/4] arch-shape overflow-hidden shadow-card border-[10px] border-card relative cursor-pointer group"
        >
          <img
            src={santoriniCover}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt={tripData.destination}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-foreground/30 flex items-center justify-center"
          >
            <div className="bg-card/90 px-8 py-3 pill-shape shadow-card">
              <span className="font-serif text-lg text-foreground tracking-wide">Enter Trip</span>
            </div>
          </motion.div>
          <div className="absolute inset-0 bg-foreground/5 pointer-events-none" />
        </motion.div>

        <div className="bg-primary/50 px-8 py-2.5 pill-shape">
          <p className="font-serif italic text-primary-foreground text-sm">
            {(() => {
              const parseDateString = (dateStr: string): Date | null => {
                const cleaned = dateStr.replace(/\./g, '/');
                const mmddyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
                if (mmddyy) {
                  const year = mmddyy[3].length === 2 ? 2000 + parseInt(mmddyy[3]) : parseInt(mmddyy[3]);
                  return new Date(year, parseInt(mmddyy[1]) - 1, parseInt(mmddyy[2]));
                }
                const monthNames: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sept: 8, sep: 8, oct: 9, nov: 10, dec: 11 };
                const named = dateStr.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
                if (named) {
                  const m = monthNames[named[1].toLowerCase()];
                  if (m !== undefined) return new Date(parseInt(named[3]), m, parseInt(named[2]));
                }
                return null;
              };
              const tripDate = parseDateString(tripData.date);
              if (tripDate) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                tripDate.setHours(0, 0, 0, 0);
                const diff = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (diff > 0) return `${diff} days away`;
                if (diff === 0) return "Today!";
                return `${Math.abs(diff)} days ago`;
              }
              return `${tripData.days} days away`;
            })()}
          </p>
        </div>
      </div>

      <div className="h-16" />
    </motion.div>
  );
};

export default CoverScreen;
