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
            {tripData.days} days away
          </p>
        </div>
      </div>

      <p className="font-serif italic text-foreground/40 max-w-[260px] text-xl leading-relaxed">
        {tripData.quote}
      </p>
    </motion.div>
  );
};

export default CoverScreen;
