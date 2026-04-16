import { useState, useRef, useEffect } from "react";
import type { TripData, DashboardTab, DetailView } from "@/types/honeymoon";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Settings, LogOut, CalendarDays, MapPin, UserCircle } from "lucide-react";
import moonLogo from "@/assets/moon-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getFormattedDate, getDaysUntilTrip } from "@/lib/dateUtils";

interface DashboardHeaderProps {
  tripData: TripData;
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  initials?: string;
  onGoToSettings?: () => void;
  onOpenDetail?: (view: DetailView) => void;
}

const tabs: { key: DashboardTab; label: string }[] = [
  { key: "planning", label: "Planning" },
  { key: "overview", label: "Trip Overview" },
  { key: "itinerary", label: "Itinerary" },
];

const DashboardHeader = ({ tripData, tab, onTabChange, initials, onGoToSettings, onOpenDetail }: DashboardHeaderProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setProfileOpen(false);
    navigate("/auth");
  };

  const formattedDate = getFormattedDate(tripData.date);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-foreground/5" style={{ boxShadow: "0 1px 8px -2px hsl(10 8% 12% / 0.04)" }}>
      {/* Top row: logo + wordmark + profile avatar */}
      <div className="relative flex items-center justify-center gap-4 pt-6 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="relative flex-shrink-0" style={{ width: 90, height: 90 }}>
          <img src={moonLogo} alt="Logo" className="w-full h-full object-contain" />
          {initials && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-serif text-base" style={{ fontSize: "11px", letterSpacing: "0.15em", transform: "translateX(-0.5px)", color: '#52210e' }}>
                {initials}
              </span>
            </div>
          )}
        </div>
        <span
          className="font-serif"
          style={{ fontSize: "40px", letterSpacing: "0.4em", fontWeight: 300, color: '#52210e' }}
        >
          SÉJOUR
        </span>

        {/* Profile Avatar — top right */}
        <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="w-9 h-9 rounded-full bg-[#f5e6e2] border border-foreground/[0.06] flex items-center justify-center transition-colors duration-200 group hover:bg-[#e8d0cc]"
          >
            <Menu size={18} strokeWidth={1.2} className="text-[#52210e] transition-colors duration-200" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-[260px] bg-background rounded-xl border border-foreground/[0.06] shadow-lg overflow-hidden"
                style={{ boxShadow: "0 12px 40px -8px hsl(10 8% 12% / 0.12)" }}
              >
                {/* Trip Info */}
                <div className="px-5 pt-5 pb-4 border-b border-foreground/5">
                  <p className="font-serif text-xs uppercase tracking-widest text-foreground/80">OUR HONEYMOON</p>
                  <div className="mt-2 space-y-1.5">
                    {tripData.destination && (
                      <div className="flex items-center gap-2 text-foreground/45">
                        <MapPin size={13} strokeWidth={1.3} />
                        <span className="text-[11px] uppercase tracking-[0.15em]">{tripData.destination}</span>
                      </div>
                    )}
                    {formattedDate && (
                      <div className="flex items-center gap-2 text-foreground/45">
                        <CalendarDays size={13} strokeWidth={1.3} />
                        <span className="text-[11px] uppercase tracking-[0.15em]">{formattedDate}{getDaysUntilTrip(tripData.date) ? ` · ${getDaysUntilTrip(tripData.date)!.toUpperCase()}` : ''}</span>
                      </div>
                    )}
                    <button
                      onClick={() => { onOpenDetail?.('travelerInfo'); setProfileOpen(false); }}
                      className="flex items-center gap-2 text-foreground/45 hover:text-foreground/70 transition-colors w-full"
                    >
                      <UserCircle size={13} strokeWidth={1.3} />
                      <span className="text-[11px] uppercase tracking-[0.15em]">Traveler Profiles</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="py-2 px-2">
                  <button
                    onClick={() => { onGoToSettings?.(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground/60 hover:bg-primary/15 hover:text-foreground/80 transition-colors duration-150"
                  >
                    <Settings size={15} strokeWidth={1.3} />
                    <span className="text-[13px] font-serif tracking-wide">Trip Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
                  >
                    <LogOut size={15} strokeWidth={1.3} />
                    <span className="text-[13px] font-serif tracking-wide">Log Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tab navigation — hidden on mobile */}
      <nav className="hidden md:flex items-center justify-center gap-12 pb-2.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`relative text-[12px] uppercase tracking-[0.25em] pb-2 transition-colors duration-200 ${
              tab === t.key ? "text-foreground/80" : "text-foreground/25 hover:text-foreground/45"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-foreground/25"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default DashboardHeader;
