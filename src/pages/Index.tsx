import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import type { TripData, AppView, DashboardTab, DetailView } from '@/types/honeymoon';
import { useTripData } from '@/hooks/useTripData';
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
  const [tab, setTab] = useState<DashboardTab>(
    () => (sessionStorage.getItem('activeTab') as DashboardTab) || 'planning'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailView, setDetailView] = useState<DetailView>(null);

  const {
    loading,
    hasProfile,
    tripData,
    setTripData,
    saveProfile,
    transportItems,
    setTransportItems,
    transportCallbacks,
    accommodationItems,
    setAccommodationItems,
    accommodationCallbacks,
    activityItems,
    setActivityItems,
    activityCallbacks,
    reservationItems,
    setReservationItems,
    reservationCallbacks,
    itineraryDays,
    setItineraryDays,
    saveItineraryDays,
  } = useTripData();

  const saveItineraryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasItineraryLoadedRef = useRef(false);

  // Debounced save whenever itineraryDays changes (skip the initial load)
  useEffect(() => {
    if (loading) return;
    if (!hasItineraryLoadedRef.current) {
      hasItineraryLoadedRef.current = true;
      return;
    }
    if (saveItineraryTimerRef.current) clearTimeout(saveItineraryTimerRef.current);
    saveItineraryTimerRef.current = setTimeout(() => {
      saveItineraryDays(itineraryDays);
    }, 1000);
  }, [itineraryDays, loading]);

  // Persist active tab across refreshes
  useEffect(() => {
    sessionStorage.setItem('activeTab', tab);
  }, [tab]);

  // Returning users skip the setup screen
  useEffect(() => {
    if (!loading && hasProfile) setView('dashboard');
  }, [loading, hasProfile]);

  const handleWelcomeComplete = (data: TripData) => {
    setTripData(data);
    saveProfile(data);
    setView('dashboard');
  };

  const getInitials = () => {
    const parts = tripData.names.split(/[,&]|\band\b|\s+/).map(s => s.trim()).filter(Boolean);
    return parts.length >= 2
      ? `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`
      : tripData.names.substring(0, 2).toUpperCase();
  };

  if (loading) return null;

  return (
    <div className="w-full max-w-[430px] md:max-w-none mx-auto min-h-screen bg-background text-foreground overflow-hidden shadow-card relative bg-subtle-gradient">
      <AnimatePresence mode="wait">
        {view === 'welcome' && (
          <WelcomeScreen key="welcome" onComplete={handleWelcomeComplete} initialData={tripData} />
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
            onOpenDetail={setDetailView}
          />

          {/* Spacer for fixed header */}
          <div className="h-[100px] md:h-[165px] flex-shrink-0" />

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
                days={itineraryDays}
                tripData={tripData}
                transportItems={transportItems}
                accommodationItems={accommodationItems}
                activityItems={activityItems}
                reservationItems={reservationItems}
                onAddActivity={(newAct) => { setActivityItems(prev => [...prev, newAct]); activityCallbacks.onAdd(newAct); }}
                onRemoveActivity={(id) => { setActivityItems(prev => prev.filter(a => a.id !== id)); activityCallbacks.onDelete(id); }}
                onGoToSettings={() => setView('welcome')}
                onDaysChange={setItineraryDays}
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

      {createPortal(
        <AnimatePresence>
          {detailView && (
            <DetailViewComponent
              key={detailView}
              view={detailView}
              onBack={() => setDetailView(null)}
              transportItems={transportItems}
              setTransportItems={setTransportItems}
              transportCallbacks={transportCallbacks}
              accommodationItems={accommodationItems}
              setAccommodationItems={setAccommodationItems}
              accommodationCallbacks={accommodationCallbacks}
              activityItems={activityItems}
              setActivityItems={setActivityItems}
              activityCallbacks={activityCallbacks}
              reservationItems={reservationItems}
              setReservationItems={setReservationItems}
              reservationCallbacks={reservationCallbacks}
              tripData={{ destination: tripData.destination, days: tripData.days, names: tripData.names }}
              onAddToItinerary={(days) => {
                setItineraryDays(days);
                setDetailView(null);
                setTab('itinerary');
              }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Index;
