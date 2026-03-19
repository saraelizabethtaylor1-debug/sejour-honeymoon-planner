import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Map, CalendarDays, Settings, Users } from 'lucide-react';
import type { DashboardTab, DetailView } from '@/types/honeymoon';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: DashboardTab) => void;
  onOpenDetail?: (view: DetailView) => void;
  onGoToSettings?: () => void;
}

const menuItems = [
  { icon: ClipboardList, label: 'Planning', action: 'planning' as const },
  { icon: Map, label: 'Trip Overview', action: 'overview' as const },
  { icon: CalendarDays, label: 'Itinerary', action: 'itinerary' as const },
  { icon: Users, label: 'Traveler Info', action: 'travelerInfo' as const },
  { icon: Settings, label: 'Settings', action: 'settings' as const },
];

const SideMenu = ({ isOpen, onClose, onNavigate, onOpenDetail, onGoToSettings }: SideMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/15 z-40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-background z-50 px-8 py-16 bg-subtle-gradient"
          >
            <button onClick={onClose} className="absolute top-6 right-6">
              <X size={20} strokeWidth={1.5} className="text-foreground/40" />
            </button>

            <h2 className="font-script text-4xl text-foreground mb-12">honeymoon</h2>

            <nav className="space-y-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.action === 'settings') {
                      onGoToSettings?.();
                    } else if (item.action === 'travelerInfo') {
                      onOpenDetail?.('travelerInfo');
                    } else onNavigate(item.action);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 pill-shape text-foreground/60 hover:bg-primary/20 hover:text-foreground transition-all duration-200"
                >
                  <item.icon size={18} strokeWidth={1.4} />
                  <span className="font-serif text-lg tracking-wide">{item.label}</span>
                </button>
              ))}
            </nav>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideMenu;
