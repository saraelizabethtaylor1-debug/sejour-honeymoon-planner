import { motion } from 'framer-motion';
import { CheckCircle2, DollarSign, Briefcase, StickyNote } from 'lucide-react';
import type { DetailView, TripData } from '@/types/honeymoon';
import santoriniCover from '@/assets/santorini-cover.jpg';

interface PlanningTabProps {
  onOpenDetail: (view: DetailView) => void;
  tripData: TripData;
}

const archCards = [
  { title: 'to-dos', icon: CheckCircle2, view: 'todos' as DetailView },
  { title: 'budget', icon: DollarSign, view: 'budget' as DetailView },
  { title: 'packing', icon: Briefcase, view: 'packing' as DetailView },
  { title: 'notes', icon: StickyNote, view: 'notes' as DetailView },
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
    <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-12 lg:gap-16">
      {/* Arched Cover Image */}
      <div className="flex-shrink-0 w-full max-w-[260px] sm:max-w-[280px] md:max-w-[300px]">
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
      <div className="flex-1 flex flex-col items-center md:items-start md:justify-end md:self-stretch gap-4 md:gap-5">
        {/* Headline */}
        <div className="text-center md:text-left max-w-full">
          <span className="font-script text-4xl sm:text-5xl lg:text-[3.4rem] text-foreground/80 leading-[1.2]">
            happily ever after
          </span>
          <span
            className="font-serif text-2xl sm:text-3xl lg:text-[2.4rem] text-foreground/60 ml-2 inline"
            style={{ letterSpacing: '0.08em', fontWeight: 300 }}
          >
            starts here.
          </span>
        </div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-6 w-full"
        >
          {archCards.map((card) => (
            <motion.button
              key={card.title}
              variants={item}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenDetail(card.view)}
              className="flex flex-col items-center justify-end gap-3 w-full pb-5 bg-primary/60 rounded-xl transition-shadow duration-200 hover:shadow-card"
              style={{
                aspectRatio: '1 / 1.3',
                boxShadow: '0 2px 12px -3px hsl(0 16% 43% / 0.06)',
              }}
            >
              <card.icon
                size={28}
                strokeWidth={1.4}
                className="text-primary-foreground/50"
              />
              <span
                className="font-body text-xs text-foreground/70 uppercase"
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
