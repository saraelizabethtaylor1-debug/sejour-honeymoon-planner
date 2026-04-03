import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wallet, Briefcase, PenLine, Camera } from 'lucide-react';
import type { DetailView, TripData } from '@/types/honeymoon';

interface PlanningTabProps {
  onOpenDetail: (view: DetailView) => void;
  tripData: TripData;
  onUpdateCoverImage?: (url: string) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const PlanningTab = ({ onOpenDetail, tripData, onUpdateCoverImage }: PlanningTabProps) => {
  const hasCoverImage = !!tripData.coverImage;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onUpdateCoverImage?.(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex justify-center py-0 my-[125px]">
      <div style={{ width: '70vw', height: 600 }} className="flex items-end">
        {/* Arch photo — left, full height */}
        <div style={{ width: '46%', flexShrink: 0, height: 600 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div
            className="w-full h-full arch-shape overflow-hidden border-[8px] border-card cursor-pointer"
            style={{
              boxShadow: '0 12px 40px -8px hsl(0 16% 43% / 0.12), 0 4px 16px -4px hsl(0 16% 43% / 0.06)',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {hasCoverImage ? (
              <img
                src={tripData.coverImage}
                className="w-full h-full object-cover"
                alt={tripData.destination}
              />
            ) : (
              <div className="w-full h-full bg-primary/40 flex items-center justify-center">
                <Camera size={40} strokeWidth={1} className="text-foreground/25" />
              </div>
            )}
          </div>
        </div>

        {/* 32px gap */}
        <div style={{ width: 32, flexShrink: 0 }} />

        {/* Right column — bottom half has headline + cards */}
        <div style={{ width: '54%', height: 600 }} className="flex flex-col justify-end">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="leading-[1.1] whitespace-nowrap"
            style={{ marginBottom: 20 }}
          >
            <span className="font-script text-3xl sm:text-4xl lg:text-[3.4rem]" style={{ color: 'hsl(0 20% 32%)' }}>
              happily ever after
            </span>
            <span
              className="font-serif text-xl sm:text-2xl text-foreground/50 ml-2 inline lg:text-lg"
              style={{ letterSpacing: '0.08em', fontWeight: 300 }}
            >
              starts here.
            </span>
          </motion.div>

          {/* 2x2 Card Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 w-full"
            style={{ gap: 20 }}
          >
            {[
              { title: 'to-dos', icon: Heart, view: 'todos' as const },
              { title: 'budget', icon: Wallet, view: 'budget' as const },
              { title: 'packing', icon: Briefcase, view: 'packing' as const },
              { title: 'notes', icon: PenLine, view: 'notes' as const },
            ].map((card) => (
              <motion.button
                key={card.title}
                variants={item}
                whileHover={{ scale: 1.02, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.12)', transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenDetail(card.view)}
                className="planning-card flex flex-col items-center justify-center gap-2.5 bg-primary/50 rounded-xl transition-shadow duration-200"
                style={{ boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)', height: 120 }}
              >
                <card.icon size={22} strokeWidth={1} className="text-foreground/50" />
                <span className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                  {card.title}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlanningTab;
