import { motion } from 'framer-motion';
import type { TripData } from '@/types/honeymoon';
import santoriniCover from '@/assets/santorini-cover.jpg';

interface CoverScreenProps {
  tripData: TripData;
  onEnter: () => void;
}

const CoverScreen = ({ tripData, onEnter }: CoverScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen relative flex flex-col items-center justify-between py-16 px-8 text-center"
    >
      <p className="text-label">Honeymoon Planner</p>

      <div className="flex flex-col items-center gap-6 w-full">
        <h2 className="font-script text-5xl text-primary-foreground leading-none">
          {tripData.destination.split(' ')[0] || 'Greece'}
        </h2>

        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onEnter}
          className="w-full max-w-[300px] aspect-[3/4] arch-shape overflow-hidden shadow-card border-[10px] border-card relative cursor-pointer"
        >
          <img
            src={santoriniCover}
            className="w-full h-full object-cover"
            alt={tripData.destination}
          />
          <div className="absolute inset-0 bg-foreground/5" />
        </motion.div>

        <div className="bg-primary/60 px-8 py-2 pill-shape">
          <p className="font-serif italic text-primary-foreground text-sm">
            {tripData.days} days away
          </p>
        </div>
      </div>

      <p className="font-serif italic text-foreground/50 max-w-[260px] text-xl leading-relaxed">
        {tripData.quote}
      </p>
    </motion.div>
  );
};

export default CoverScreen;
