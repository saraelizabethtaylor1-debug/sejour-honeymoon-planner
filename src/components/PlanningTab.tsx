import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Wallet, Briefcase, PenLine, Camera, Sparkles } from 'lucide-react';
import type { DetailView, TripData } from '@/types/honeymoon';
import ImagePickerModal from '@/components/ImagePickerModal';

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
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex justify-center py-0 mt-12 mb-8">
      <div style={{ width: '70vw', height: 500 }} className="flex items-end">
        {/* Arch photo — left, full height */}
        <div style={{ width: '46%', flexShrink: 0, height: 500 }}>
          {pickerOpen && (
            <ImagePickerModal
              onSelect={(url) => { onUpdateCoverImage?.(url); setPickerOpen(false); }}
              onClose={() => setPickerOpen(false)}
            />
          )}
          <div
            className="w-full h-full arch-shape overflow-hidden border-[8px] border-card cursor-pointer"
            style={{
              boxShadow: '0 12px 40px -8px hsl(0 16% 43% / 0.12), 0 4px 16px -4px hsl(0 16% 43% / 0.06)',
            }}
            onClick={() => setPickerOpen(true)}
          >
            {hasCoverImage ? (
              <img
                src={tripData.coverImage}
                className="w-full h-full object-cover"
                alt={tripData.destination}
              />
            ) : (
              <div className="w-full h-full bg-primary/40 flex flex-col items-center justify-center gap-2">
                <Camera size={40} strokeWidth={1} className="text-foreground/25" />
                <span className="font-serif text-sm text-foreground/30">Trip inspiration photo</span>
              </div>
            )}
          </div>
        </div>

        {/* 32px gap */}
        <div style={{ width: 32, flexShrink: 0 }} />

        {/* Right column */}
        <div style={{ width: '54%', height: 500 }} className="flex flex-col justify-end">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="leading-[1.1] whitespace-nowrap"
            style={{ marginBottom: 24 }}
          >
            <span className="font-script text-3xl sm:text-4xl lg:text-[3.4rem]" style={{ color: '#52210e' }}>
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
                style={{ boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.08)', height: 110 }}
              >
                <card.icon size={22} strokeWidth={1} className="text-foreground/50" />
                <span className="font-body text-[10px] uppercase tracking-[0.14em] text-foreground/60">
                  {card.title}
                </span>
              </motion.button>
            ))}

            {/* AI Concierge — full width */}
            <motion.button
              variants={item}
              whileHover={{ scale: 1.01, boxShadow: '0 6px 24px -4px hsl(0 16% 43% / 0.16)', transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenDetail('concierge')}
              className="col-span-2 flex items-center justify-center gap-3 rounded-xl transition-shadow duration-200"
              style={{
                background: 'linear-gradient(135deg, hsl(0 20% 85% / 0.6), hsl(0 16% 75% / 0.4))',
                boxShadow: '0 3px 16px -4px hsl(0 16% 43% / 0.12)',
                height: 60,
              }}
            >
              <Sparkles size={15} strokeWidth={1.5} className="text-foreground/50" />
              <span className="font-serif" style={{ letterSpacing: '0.4em', fontWeight: 300, color: '#52210e', fontSize: '1rem' }}>
                AI CONCIERGE
              </span>
              <span className="font-body text-[9px] uppercase tracking-[0.18em] text-foreground/40 ml-1">
                plan with AI
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlanningTab;
