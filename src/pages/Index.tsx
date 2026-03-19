import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { TripData, AppView, DashboardTab, DetailView, TransportItem, AccommodationItem, ActivityItem, ReservationItem } from '@/types/honeymoon';
import { defaultTripData, sampleItinerary, sampleTransport, sampleAccommodations, sampleActivities, sampleReservations } from '@/data/sampleData';
import WelcomeScreen from '@/components/WelcomeScreen';
import CoverScreen from '@/components/CoverScreen';
import DashboardHeader from '@/components/DashboardHeader';
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

  // Lifted state for overview data
  const [transportItems, setTransportItems] = useState<TransportItem[]>(sampleTransport);
  const [accommodationItems, setAccommodationItems] = useState<AccommodationItem[]>(sampleAccommodations);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>(sampleActivities);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>(sampleReservations);

  const handleWelcomeComplete = (data: TripData) => {
    setTripData(data);
    setView('home');
  };

  return (
    <div className="w-full max-w-[430px] md:max-w-none mx-auto min-h-screen bg-background text-foreground overflow-hidden shadow-card relative bg-subtle-gradient">
      <AnimatePresence mode="wait">
        {view === 'welcome' && (
          <WelcomeScreen key="welcome" onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>

      {view === 'home' && (
        <CoverScreen tripData={tripData} onEnter={() => setView('dashboard')} />
      )}

      {view === 'dashboard' && (
        <div className="h-screen flex flex-col">
          <DashboardHeader
            tripData={tripData}
            tab={tab}
            onTabChange={setTab}
            onMenuToggle={() => setMenuOpen(true)}
          />

          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {tab === 'planning' && <PlanningTab onOpenDetail={setDetailView} tripData={tripData} />}
            {tab === 'overview' && <OverviewTab onOpenDetail={setDetailView} />}
            {tab === 'itinerary' && (
              <ItineraryTab
                days={sampleItinerary}
                tripData={tripData}
                transportItems={transportItems}
                accommodationItems={accommodationItems}
                activityItems={activityItems}
                reservationItems={reservationItems}
                onAddActivity={(newAct) => setActivityItems(prev => [...prev, newAct])}
              />
            )}
          </main>
        </div>
      )}

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(t) => { setTab(t); setView('dashboard'); }}
        onGoHome={() => setView('home')}
        onOpenDetail={setDetailView}
        onGoToSettings={() => setView('welcome')}
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
