
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trip, TransportMode, ViewMode, FilterState } from './types';
import { getTrips, deleteTrip, getSettings, updateTrip, addTrip, saveTrips } from './services/storageService';
import TripCard from './components/TripCard';
import AddTripModal from './components/AddTripModal';
import SettingsModal from './components/SettingsModal';
import FilterBar from './components/FilterBar';
import WorldMap, { WorldMapHandle } from './components/WorldMap';
import { CardsView, ListView, CompactView, OverviewView, StatsView } from './components/TripListViews';
import { Settings, CreditCard, List as ListIcon, Monitor, Map as MapIcon, Footprints, LayoutDashboard, Search, Plus } from 'lucide-react';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [highlightTrip, setHighlightTrip] = useState<Trip | undefined>(undefined);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    years: [], countries: [], provinces: [], cities: [], search: ''
  });
  const [lang, setLang] = useState<Language>('zh'); 
  const [theme, setTheme] = useState<'light'|'dark'|'system'>('system');
  const [username, setUsername] = useState('Momo');
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>(undefined);
  const [isDark, setIsDark] = useState(true);
  const mapRef = useRef<WorldMapHandle>(null);

  const refreshTrips = () => {
    setTrips(getTrips());
  };

  useEffect(() => {
    const settings = getSettings();
    if (settings.language) setLang(settings.language);
    if (settings.theme) setTheme(settings.theme);
    if (settings.username) setUsername(settings.username);
    refreshTrips();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const systemDark = mediaQuery.matches;
      const effectiveDark = theme === 'dark' || (theme === 'system' && systemDark);
      setIsDark(effectiveDark);
      if (effectiveDark) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const t = translations[lang];

  const handleUpdateTrip = (updatedTrip: Trip) => {
    updateTrip(updatedTrip);
    refreshTrips();
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return trip.origin.name.toLowerCase().includes(s) || trip.destination.name.toLowerCase().includes(s);
      }
      return true;
    }).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [trips, filters]);

  const NavItem = ({ mode, icon: Icon, label }: { mode: ViewMode, icon: any, label: string }) => (
    <button 
      onClick={() => setViewMode(mode)}
      className={`flex flex-col items-center justify-center flex-1 py-3 transition-all ${viewMode === mode ? 'text-blue-500 scale-110' : 'text-slate-400 dark:text-slate-600'}`}
    >
      <Icon size={20} strokeWidth={viewMode === mode ? 3 : 2} />
      <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 font-sans pb-24">
      
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MapIcon size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">{t.appTitle}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Add Trip Button Moved to Header */}
            <button onClick={() => setIsAddModalOpen(true)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
              <Plus size={22} strokeWidth={2.5} />
            </button>
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Settings size={20} />
            </button>
          </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto pt-20 px-4">
        {isSearchOpen && (
          <div className="mb-6 animate-slide-up">
            <FilterBar trips={trips} onFilterChange={setFilters} lang={lang} />
          </div>
        )}

        <div className="animate-fade-in">
          {viewMode === 'overview' && <OverviewView trips={filteredTrips} lang={lang} onAddTrip={() => setIsAddModalOpen(true)} onViewChange={setViewMode} />}
          {viewMode === 'cards' && <CardsView trips={filteredTrips} lang={lang} onDelete={deleteTrip} onEdit={setEditingTrip} onModeClick={() => {}} onTripClick={setHighlightTrip} username={username} onUpdateTrip={handleUpdateTrip} />}
          {viewMode === 'list' && <ListView trips={filteredTrips} lang={lang} onDelete={deleteTrip} onEdit={setEditingTrip} onModeClick={() => {}} />}
          {viewMode === 'routes' && (
            <div className="fixed inset-0 top-16 bottom-24 bg-white dark:bg-black">
              <WorldMap ref={mapRef} trips={filteredTrips} highlightTrip={highlightTrip} viewMode="routes" interactionEnabled={true} />
            </div>
          )}
          {viewMode === 'visited' && <StatsView trips={filteredTrips} lang={lang} onDelete={deleteTrip} onEdit={setEditingTrip} onModeClick={() => {}} />}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-[#0b0f1a]/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 z-50 px-2 flex items-center justify-around max-w-2xl mx-auto rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <NavItem mode="overview" icon={LayoutDashboard} label={t.layoutOverview} />
          <NavItem mode="cards" icon={CreditCard} label={t.layoutCards} />
          <NavItem mode="routes" icon={MapIcon} label={t.viewRoutes} />
          <NavItem mode="visited" icon={Footprints} label={t.viewVisited} />
          <NavItem mode="list" icon={ListIcon} label={t.layoutList} />
      </nav>

      {/* Modals */}
      {showSettingsMenu && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0b0f1a] animate-slide-up overflow-y-auto">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <h2 className="text-xl font-black uppercase tracking-tighter">{t.settingsTitle}</h2>
            <button onClick={() => setShowSettingsMenu(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">✕</button>
          </div>
          <SettingsModal onDataChange={refreshTrips} lang={lang} onLanguageChange={setLang} onThemeChange={setTheme} onUsernameChange={setUsername} />
        </div>
      )}

      <AddTripModal 
        isOpen={isAddModalOpen || !!editingTrip} 
        onClose={() => { setIsAddModalOpen(false); setEditingTrip(undefined); }} 
        onSave={(newTrips) => {
          if (editingTrip) updateTrip(newTrips[0]);
          else addTrip(newTrips);
          refreshTrips();
          setEditingTrip(undefined);
          setIsAddModalOpen(false);
        }}
        lang={lang}
        initialData={editingTrip}
      />
    </div>
  );
};

export default App;
