import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { TripData, AppView, DashboardTab, DetailView } from '@/types/honeymoon';
import { defaultTripData, sampleItinerary } from '@/data/sampleData';
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

  const handleWelcomeComplete = (data: TripData) => {
    setTripData(data);
    setView('home');
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-background text-foreground overflow-hidden shadow-card relative bg-subtle-gradient">
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

          <main className="flex-1 overflow-y-auto px-6 py-8">
            {tab === 'planning' && <PlanningTab onOpenDetail={setDetailView} />}
            {tab === 'overview' && <OverviewTab onOpenDetail={setDetailView} />}
            {tab === 'itinerary' && <ItineraryTab days={sampleItinerary} />}
          </main>
        </div>
      )}

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(t) => { setTab(t); setView('dashboard'); }}
        onGoHome={() => setView('home')}
      />

      <AnimatePresence>
        {detailView && (
          <DetailViewComponent
            key={detailView}
            view={detailView}
            onBack={() => setDetailView(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
