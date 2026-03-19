import { motion } from 'framer-motion';
import { Heart, Wallet, Briefcase, PenLine } from 'lucide-react';
import type { DetailView, TripData } from '@/types/honeymoon';
import santoriniCover from '@/assets/santorini-cover.jpg';

interface PlanningTabProps {
  onOpenDetail: (view: DetailView) => void;
  tripData: TripData;
}

const archCards = [
  { title: 'to-dos', icon: Heart, view: 'todos' as DetailView },
  { title: 'budget', icon: Wallet, view: 'budget' as DetailView },
  { title: 'packing', icon: Briefcase, view: 'packing' as DetailView },
  { title: 'notes', icon: PenLine, view: 'notes' as DetailView },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const PlanningTab = ({ onOpenDetail, tripData }: PlanningTabProps) => {
  const coverSrc = tripData.coverImage || santoriniCover;

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 md:gap-12 lg:gap-16">
      {/* Arched Cover Image */}
      <div className="flex-shrink-0 w-full max-w-[240px] sm:max-w-[260px] md:max-w-[300px]">
        <div
          className="w-full aspect-[3/4] arch-shape overflow-hidden border-[8px] border-card"
          style={{
            boxShadow: '0 12px 40px -8px hsl(0 16% 43% / 0.12), 0 4px 16px -4px hsl(0 16% 43% / 0.06)',
          }}
        >
          <img
            src={coverSrc}
            className="w-full h-full object-cover"
            alt={tripData.destination}
          />
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col items-center md:items-start md:justify-center md:self-stretch gap-4 sm:gap-5 md:gap-6">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center md:text-left max-w-full leading-[1.1] whitespace-nowrap"
        >
          <span className="font-script text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] text-foreground/80">
            happily ever after
          </span>
          <span
            className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-[2.4rem] text-foreground/50 ml-2 inline"
            style={{ letterSpacing: '0.08em', fontWeight: 300 }}
          >
            starts here.
          </span>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 w-full max-w-sm sm:max-w-none"
        >
          {archCards.map((card) => (
            <motion.button
              key={card.title}
              variants={item}
              whileHover={{ scale: 1.02, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenDetail(card.view)}
              className="flex flex-col items-center justify-end gap-2.5 w-full pb-4 bg-primary/60 rounded-xl transition-shadow duration-200"
              style={{
                aspectRatio: '1 / 1.25',
                boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)',
              }}
            >
              <card.icon
                size={24}
                strokeWidth={1.2}
                className="text-primary-foreground/70"
              />
              <span
                className="font-body text-[10px] text-foreground/70 uppercase"
                style={{ letterSpacing: '0.12em' }}
              >
                {card.title}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default PlanningTab;
