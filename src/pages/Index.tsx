import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { TripData, AppView, DashboardTab, DetailView, TransportItem, AccommodationItem, ActivityItem, ReservationItem } from '@/types/honeymoon';
import { defaultTripData, sampleItinerary, sampleTransport, sampleAccommodations, sampleActivities, sampleReservations } from '@/data/sampleData';
import WelcomeScreen from '@/components/WelcomeScreen';
import DashboardHeader from '@/components/DashboardHeader';
import BottomNav from '@/components/BottomNav';
import SideMenu from '@/components/SideMenu';
import PlanningTab from '@/components/PlanningTab';
import OverviewTab from '@/components/OverviewTab';
import ItineraryTab from '@/components/ItineraryTab';
import DetailViewComponent from '@/components/DetailViews';

const Index = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [tab, setTab] = useState<DashboardTab>('planning');
  const [tripData, setTripData] = useState<TripData>(defaultTripData);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailView, setDetailView] = useState<DetailView>(null);

  const [transportItems, setTransportItems] = useState<TransportItem[]>([]);
  const [accommodationItems, setAccommodationItems] = useState<AccommodationItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]);

  const handleWelcomeComplete = (data: TripData) => {
    setTripData(data);
    setView('dashboard');
  };

  const getInitials = () => {
    const parts = tripData.names.split(/[,&]|\band\b|\s+/).map(s => s.trim()).filter(Boolean);
    return parts.length >= 2
      ? `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`
      : tripData.names.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-[430px] md:max-w-none mx-auto min-h-screen bg-background text-foreground overflow-hidden shadow-card relative bg-subtle-gradient">
      <AnimatePresence mode="wait">
        {view === 'welcome' && (
          <WelcomeScreen key="welcome" onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>

      {view === 'dashboard' && (
        <div className="min-h-screen flex flex-col">
          <DashboardHeader
            tripData={tripData}
            tab={tab}
            onTabChange={setTab}
            initials={getInitials()}
            onGoToSettings={() => setView('welcome')}
          />

          {/* Spacer for fixed header */}
          <div className="h-[100px] md:h-[140px] flex-shrink-0" />

          <main className={`flex-1 px-4 sm:px-6 lg:px-8 pb-20 md:pb-0 ${tab === 'planning' ? 'py-0 flex flex-col overflow-y-auto md:overflow-hidden' : tab === 'overview' ? 'py-0 sm:py-0 flex flex-col overflow-hidden' : 'py-4 sm:py-5 overflow-y-auto'}`}>
            {tab === 'planning' && (
              <PlanningTab
                onOpenDetail={setDetailView}
                tripData={tripData}
                onUpdateCoverImage={(url) => setTripData(prev => ({ ...prev, coverImage: url }))}
              />
            )}
            {tab === 'overview' && (
              <OverviewTab
                onOpenDetail={setDetailView}
                tripData={tripData}
                accommodationItems={accommodationItems}
                activityItems={activityItems}
                reservationItems={reservationItems}
                transportItems={transportItems}
              />
            )}
            {tab === 'itinerary' && (
              <ItineraryTab
                days={sampleItinerary}
                tripData={tripData}
                transportItems={transportItems}
                accommodationItems={accommodationItems}
                activityItems={activityItems}
                reservationItems={reservationItems}
                onAddActivity={(newAct) => setActivityItems(prev => [...prev, newAct])}
                onRemoveActivity={(id) => setActivityItems(prev => prev.filter(a => a.id !== id))}
              />
            )}
          </main>

          <BottomNav tab={tab} onTabChange={setTab} />
        </div>
      )}

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(t) => { setTab(t); setView('dashboard'); }}
        onOpenDetail={setDetailView}
        onGoToSettings={() => setView('welcome')}
        initials={getInitials()}
      />

      <AnimatePresence>
        {detailView && (
          <DetailViewComponent
            key={detailView}
            view={detailView}
            onBack={() => setDetailView(null)}
            transportItems={transportItems}
            setTransportItems={setTransportItems}
            accommodationItems={accommodationItems}
            setAccommodationItems={setAccommodationItems}
            activityItems={activityItems}
            setActivityItems={setActivityItems}
            reservationItems={reservationItems}
            setReservationItems={setReservationItems}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
