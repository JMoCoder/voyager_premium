
import React, { useState, useMemo, useRef } from 'react';
import { Trip, LocationData, TransportMode, ViewMode } from '../types';
import TripCard from './TripCard';
import WorldMap from './WorldMap';
import { translations, Language } from '../translations';
import { MODE_CONFIG, COUNTRY_MAPPING, COUNTRY_DISPLAY_ZH } from '../constants';
import { ArrowRight, ChevronLeft, ChevronRight, Globe, MapPin, Navigation, Layers, PieChart, Building2, Map, LayoutGrid, CreditCard, List as ListIcon, Monitor, Map as MapIcon, Footprints, LayoutDashboard, RefreshCw, Plus, Calendar, Plane } from 'lucide-react';

interface ViewProps {
  trips: Trip[];
  onDelete?: (id: string) => void;
  onEdit?: (trip: Trip) => void;
  onModeClick?: (mode: TransportMode) => void;
  lang: Language;
  onViewChange?: (mode: ViewMode) => void;
  onAddTrip?: () => void;
  onTripClick?: (trip: Trip) => void;
  username?: string;
  onUpdateTrip?: (trip: Trip) => void;
}

// ... Patterns ...
const PatternWaves = ({ className }: { className?: string }) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="waves" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0 10 Q5 5 10 10 T20 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#waves)"/>
  </svg>
);
const PatternDots = ({ className }: { className?: string }) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="currentColor"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)"/>
  </svg>
);
const PatternGrid = ({ className }: { className?: string }) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>
  </svg>
);
const PatternHex = ({ className }: { className?: string }) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hex" x="0" y="0" width="20" height="34" patternUnits="userSpaceOnUse">
        <path d="M10 0 L20 5 L20 15 L10 20 L0 15 L0 5 Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex)"/>
  </svg>
);
const PatternLines = ({ className }: { className?: string }) => (
  <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="lines" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
         <path d="M0 10 L10 0" fill="none" stroke="currentColor" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#lines)"/>
  </svg>
);

const useTripStats = (trips: Trip[], lang: Language) => {
    return useMemo(() => {
        const countries = new Set<string>();
        const provinces = new Set<string>();
        const cities = new Set<string>();
        
        const mCount: Record<string, number> = {};
        const cCount: Record<string, number> = {}; 
        const pCount: Record<string, number> = {}; 
        const cityCount: Record<string, number> = {}; 

        let totalDist = 0;
        let footprintCount = 0;

        const normalize = (name: string | undefined): string | undefined => {
           if (!name) return undefined;
           if (COUNTRY_MAPPING[name]) return COUNTRY_MAPPING[name];
           return name;
        };
    
        trips.forEach(t => {
          const originCountry = normalize(t.origin.country);
          const destCountry = normalize(t.destination.country);
          
          if (originCountry) countries.add(originCountry);
          if (destCountry) countries.add(destCountry);
          
          if (t.origin.state) provinces.add(t.origin.state);
          if (t.destination.state) provinces.add(t.destination.state);
          
          const city1 = t.origin.city || t.origin.name;
          const city2 = t.destination.city || t.destination.name;
          cities.add(city1);
          cities.add(city2);
    
          totalDist += t.distanceKm;
          footprintCount += t.isRoundTrip ? 1.5 : 2;

          mCount[t.mode] = (mCount[t.mode] || 0) + 1;

          if (destCountry) cCount[destCountry] = (cCount[destCountry] || 0) + 1;
          if (originCountry) cCount[originCountry] = (cCount[originCountry] || 0) + 1;

          if (t.destination.state) pCount[t.destination.state] = (pCount[t.destination.state] || 0) + 1;
          if (t.origin.state) pCount[t.origin.state] = (pCount[t.origin.state] || 0) + 1;

          cityCount[city2] = (cityCount[city2] || 0) + 1;
          cityCount[city1] = (cityCount[city1] || 0) + 1;
        });

        const localizeKeys = (obj: Record<string, number>, type: 'country' | 'other') => {
           const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
           if (lang === 'zh' && type === 'country') {
              return entries.map(([key, count]) => {
                  return [COUNTRY_DISPLAY_ZH[key] || key, count] as [string, number];
              });
           }
           return entries;
        };

        return {
          countries: countries.size,
          provinces: provinces.size,
          cities: cities.size,
          distance: totalDist,
          trips: trips.length,
          footprints: Math.ceil(footprintCount),
          modeStats: localizeKeys(mCount, 'other'),
          countryStats: localizeKeys(cCount, 'country'),
          provinceStats: localizeKeys(pCount, 'other'),
          cityStats: localizeKeys(cityCount, 'other')
        };
      }, [trips, lang]);
};

export const OverviewView: React.FC<ViewProps> = ({ trips, lang, onAddTrip, onViewChange }) => {
  const stats = useTripStats(trips, lang);
  const t = translations[lang];
  const [orbitMode, setOrbitMode] = useState(0);

  const getOrbitModeConfig = (dist: number) => {
      const modes = [
          { label: t.statsOrbits, div: 40075, unit: lang === 'zh' ? '圈' : 'ORBITS', decimals: 2 },
          { label: t.statsShaBhy, div: 3316, unit: lang === 'zh' ? '次' : 'TIMES', decimals: 1 },
          { label: t.statsEarthMoon, div: 768800, unit: lang === 'zh' ? '次' : 'TRIPS', decimals: 4 },
          { label: t.statsMars, div: 54600000, unit: lang === 'zh' ? '次' : 'TIMES', decimals: 6 },
          { label: t.statsAndromeda, div: 2.365e19, unit: '%', decimals: 2 }
      ];
      const config = modes[orbitMode % modes.length];
      let val = dist / config.div;
      let displayVal = val.toFixed(config.decimals);
      if (config.unit === '%') {
          val = val * 100;
          displayVal = val.toExponential(4);
      }
      return { ...config, value: displayVal };
  };

  const orbitConfig = getOrbitModeConfig(stats.distance);

  const navigateTo = (view: ViewMode) => {
    if (onViewChange) onViewChange(view);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32 pt-4 space-y-4 relative">
        {/* CARD 1: ORBITS -> STATS TOGGLE (NO NAV) */}
        <div 
            onClick={(e) => { e.stopPropagation(); setOrbitMode(p => p + 1); }}
            className="relative w-full aspect-[2/1] sm:aspect-[2.5/1] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-all duration-500 hover:shadow-xl active:scale-[0.99] group"
        >
            <div className="absolute inset-0 opacity-10 grayscale mix-blend-multiply dark:mix-blend-overlay pointer-events-none scale-110">
               <WorldMap trips={trips} className="w-full h-full bg-transparent" interactionEnabled={false} viewMode="visited" hideBackground={true} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
               <div className="absolute w-48 h-48 border border-blue-500/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
               <div className="absolute w-72 h-72 border border-blue-500/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6">
                <div 
                    className="mb-2 px-3 py-1 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 pointer-events-auto cursor-pointer hover:bg-white/80 dark:hover:bg-white/10"
                >
                    {orbitConfig.label}
                </div>
                <div className="flex flex-col items-center">
                    <div className="font-mono font-black text-6xl sm:text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 drop-shadow-sm select-none">
                        {orbitConfig.value}
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-slate-400 dark:text-slate-500 tracking-[0.3em] uppercase mt-2">
                        {orbitConfig.unit}
                    </div>
                </div>
            </div>
        </div>

        {/* ROW 2: DISTANCE & TRIPS */}
        <div className="grid grid-cols-6 gap-4">
            {/* CARD 2: DISTANCE -> CARDS (Swapped from List) */}
            <div 
                onClick={() => navigateTo('cards')}
                className="col-span-3 relative rounded-[2rem] overflow-hidden h-40 shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer transition-transform active:scale-95 hover:bg-slate-100 dark:hover:bg-slate-800/80 group"
            >
                <div className="absolute inset-0 opacity-5 text-slate-900 dark:text-white pointer-events-none"><PatternWaves /></div>
                <div className="absolute inset-0 flex flex-col justify-between p-5 z-10">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            {t.statsDistance}
                            <span className="ml-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight truncate">{stats.distance.toLocaleString()}</div>
                        <div className="ml-1 text-[8px] font-bold text-slate-400 uppercase">KM</div>
                    </div>
                    <Navigation size={48} className="absolute bottom-2 right-2 text-slate-900 dark:text-white opacity-5 rotate-[-15deg] group-hover:scale-110 transition-transform" />
                </div>
            </div>

            {/* CARD 3: TRIPS -> LIST (Swapped from Cards) */}
            <div 
                onClick={() => navigateTo('list')}
                className="col-span-3 relative rounded-[2rem] overflow-hidden h-40 shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer transition-transform active:scale-95 hover:bg-slate-100 dark:hover:bg-slate-800/80 group"
            >
                <div className="absolute inset-0 opacity-5 text-slate-900 dark:text-white pointer-events-none"><PatternDots /></div>
                <div className="absolute inset-0 flex flex-col justify-between p-5 z-10">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            {t.statsTrips}
                            <span className="ml-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight">{stats.trips}</div>
                        <div className="ml-1 text-[8px] font-bold text-slate-400 uppercase">{lang === 'zh' ? '次' : 'TRIPS'}</div>
                    </div>
                    <Layers size={48} className="absolute bottom-2 right-2 text-slate-900 dark:text-white opacity-5 rotate-[15deg] group-hover:scale-110 transition-transform" />
                </div>
            </div>
        </div>

        {/* ROW 3: COUNTRIES, PROVINCES, CITIES */}
        <div className="grid grid-cols-6 gap-4">
            {/* CARD 4: COUNTRIES -> COMPACT */}
            <div 
                onClick={() => navigateTo('compact')}
                className="col-span-2 relative aspect-[3/4] sm:aspect-[1/1] rounded-[2rem] overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition-transform active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800/80 group"
            >
                <div className="absolute inset-0 opacity-5 text-slate-900 dark:text-white pointer-events-none"><PatternGrid /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 via-transparent to-transparent dark:from-slate-950/50"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
                    <div className="mb-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform"><Globe size={18} className="text-emerald-500" /></div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none mb-1">{stats.countries}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">{t.statsCountries}</div>
                </div>
            </div>

            {/* CARD 5: PROVINCES -> ROUTES (Earth) */}
            <div 
                onClick={() => navigateTo('routes')}
                className="col-span-2 relative aspect-[3/4] sm:aspect-[1/1] rounded-[2rem] overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition-transform active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800/80 group"
            >
                <div className="absolute inset-0 opacity-5 text-slate-900 dark:text-white pointer-events-none"><PatternLines /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 via-transparent to-transparent dark:from-slate-950/50"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
                    <div className="mb-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform"><Map size={18} className="text-indigo-500" /></div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none mb-1">{stats.provinces}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">{t.statsProvinces}</div>
                </div>
            </div>

            {/* CARD 6: CITIES -> VISITED (Stats/Footprints) */}
            <div 
                onClick={() => navigateTo('visited')}
                className="col-span-2 relative aspect-[3/4] sm:aspect-[1/1] rounded-[2rem] overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition-transform active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-800/80 group"
            >
                <div className="absolute inset-0 opacity-5 text-slate-900 dark:text-white pointer-events-none"><PatternHex /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 via-transparent to-transparent dark:from-slate-950/50"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 z-10">
                    <div className="mb-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform"><Building2 size={18} className="text-purple-500" /></div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none mb-1">{stats.cities}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">{t.statsCities}</div>
                </div>
            </div>
        </div>
    </div>
  );
};

export const StatsView: React.FC<ViewProps> = ({ trips, lang }) => {
    const t = translations[lang];
    const stats = useTripStats(trips, lang);
    const { modeStats, countryStats, provinceStats, cityStats } = stats;

    const ListCard = ({ title, icon: Icon, colorClass, bgClass, data }: any) => (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col">
            <div className="flex items-center mb-4">
                <div className={`p-2 rounded-xl mr-3 ${bgClass} ${colorClass}`}><Icon size={18} /></div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <div className="space-y-3 flex-1">
                {data.slice(0, 5).map(([name, count]: [string, number], i: number) => (
                    <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mr-2 ${i < 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>{i + 1}</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 pb-20 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 mr-3"><PieChart size={18} /></div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{lang === 'zh' ? '出行基因' : 'Transport DNA'}</h3>
                    </div>
                    <div className="space-y-4 flex-1">
                        {modeStats.slice(0, 5).map(([mode, count]: [string, number]) => {
                            const Config = MODE_CONFIG[mode as TransportMode];
                            const Icon = Config.icon;
                            return (
                                <div key={mode} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                                        <span className="flex items-center"><Icon size={12} className="mr-1" /> {t[mode as TransportMode]}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${Config.bg.replace('/20', '')} ${Config.color.replace('text-', 'bg-')}`} style={{ width: `${(count / trips.length) * 100}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <ListCard title={t.statsCountries} icon={Globe} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-900/20" data={countryStats} />
                <ListCard title={t.statsProvinces} icon={Map} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-900/20" data={provinceStats} />
                <ListCard title={t.statsCities} icon={Building2} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-50 dark:bg-purple-900/20" data={cityStats} />
            </div>
        </div>
    );
};

export const CardsView: React.FC<ViewProps> = (props) => {
  const sortedTrips = useMemo(() => {
     return [...props.trips].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [props.trips]);

  const groupedTrips = useMemo(() => {
     const groups: Record<string, Trip[]> = {};
     sortedTrips.forEach(t => {
         const year = t.startDate.split('-')[0];
         if (!groups[year]) groups[year] = [];
         groups[year].push(t);
     });
     return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [sortedTrips]);

  if (sortedTrips.length === 0) return null;

  return (
    <div className="relative w-full max-w-md mx-auto pb-24 px-4">
        {groupedTrips.map(([year, trips]) => (
            <div key={year} className="relative mb-16 group/year">
                {/* 
                   Artistic Sticky Year Label 
                   - Uses position: sticky to create the smooth displacement effect 
                   - Negative left margin to bleed off screen
                   - Huge font size for impact
                */}
                <div className="sticky top-24 z-0 pointer-events-none select-none h-0 overflow-visible flex flex-col">
                    <div className="
                        absolute -left-6 -top-14 sm:-left-12
                        text-[9rem] sm:text-[13rem] 
                        leading-none font-black italic tracking-tighter 
                        text-slate-900/5 dark:text-white/5 
                        mix-blend-multiply dark:mix-blend-overlay
                        transform -rotate-2 origin-top-left
                        transition-transform duration-700 ease-out
                        group-hover/year:translate-x-2 group-hover/year:scale-105
                    ">
                        {year}
                    </div>
                </div>
                
                {/* Cards Container - Higher Z-Index to float over text */}
                <div className="space-y-1 relative z-10 pt-4">
                    {trips.map((trip) => (
                        <div key={trip.id} className="relative z-10 animate-slide-up">
                             <TripCard 
                                {...props} 
                                onDelete={props.onDelete || (() => {})}
                                onEdit={props.onEdit || (() => {})}
                                onModeClick={props.onModeClick || (() => {})}
                                trip={trip} 
                                username={props.username} 
                                onCardClick={props.onTripClick}
                             />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
  );
};

export const ListView: React.FC<ViewProps> = ({ trips, onEdit, lang }) => {
  const t = translations[lang];
  const getName = (loc: LocationData) => lang === 'zh' ? (loc.name_zh || loc.name) : loc.name;
  
  return (
    <div className="space-y-2 pb-20">
      {trips.map(trip => {
        const Config = MODE_CONFIG[trip.mode];
        const Icon = Config.icon;
        const status = trip.status || 'ARRIVED';
        let statusColor = 'text-emerald-500';
        let statusLabel = t.statusArrived;
        if (status === 'PLAN') { statusColor = 'text-amber-500'; statusLabel = t.statusPlan; }
        if (status === 'TRAVELING') { statusColor = 'text-blue-500'; statusLabel = t.statusTraveling; }

        return (
          <div key={trip.id} onClick={() => onEdit && onEdit(trip)} className="flex items-center p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
             <div className={`p-3 rounded-xl ${Config.bg} mr-4`}><Icon size={18} className={Config.color} /></div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center text-base font-bold text-slate-900 dark:text-white mb-0.5">
                   <span className="truncate">{getName(trip.origin)}</span>
                   <ArrowRight size={14} className="mx-2 text-slate-300" />
                   <span className="truncate">{getName(trip.destination)}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">{trip.startDate} • {trip.distanceKm.toLocaleString()} km</div>
             </div>
             <div className="flex flex-col items-end ml-4 text-right">
                <div className={`text-[10px] font-black uppercase tracking-widest ${statusColor} flex items-center`}>{statusLabel}</div>
                <div className="text-[10px] font-mono text-slate-300 dark:text-slate-600 mt-1">{trip.origin.code} - {trip.destination.code}</div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

export const CompactView: React.FC<ViewProps> = ({ trips, onEdit, lang }) => {
  const getStatusColor = (status?: string) => {
      switch(status) {
          case 'PLAN': return 'text-yellow-500';
          case 'TRAVELING': return 'text-blue-500';
          default: return 'text-emerald-600 dark:text-emerald-500';
      }
  };

  return (
    <div className="bg-white dark:bg-black rounded-xl p-4 sm:p-6 shadow-2xl overflow-hidden pb-20 border border-slate-200 dark:border-slate-800 transition-colors duration-300 h-[calc(100vh-180px)] overflow-y-auto">
       <div className="grid grid-cols-12 gap-4 mb-4 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-amber-500/50 uppercase tracking-widest border-b border-slate-100 dark:border-amber-500/20 pb-2 font-mono transition-colors sticky top-0 bg-white dark:bg-black z-10">
          <div className="col-span-3 sm:col-span-2">DATE</div>
          <div className="col-span-3 sm:col-span-3">ORIGIN</div>
          <div className="col-span-3 sm:col-span-4">DESTINATION</div>
          <div className="col-span-3 sm:col-span-3 text-center">STATUS</div>
       </div>
       <div className="space-y-1 font-mono">
          {trips.map((trip) => {
             const originName = (lang === 'zh' ? trip.origin.name_zh : trip.origin.code || trip.origin.name) || trip.origin.name;
             const destName = (lang === 'zh' ? trip.destination.name_zh : trip.destination.code || trip.destination.name) || trip.destination.name;
             const status = trip.status || 'ARRIVED';
             return (
               <div key={trip.id} onClick={() => onEdit && onEdit(trip)} className="grid grid-cols-12 gap-4 py-3 text-xs sm:text-sm text-slate-600 dark:text-amber-500 hover:bg-slate-50 dark:hover:bg-amber-500/10 cursor-pointer transition-colors border-b border-slate-100 dark:border-amber-500/10 items-center last:border-0">
                  <div className="col-span-3 sm:col-span-2 text-slate-500 dark:text-amber-500/80">{trip.startDate}</div>
                  <div className="col-span-3 sm:col-span-3 truncate"><span className="text-slate-900 dark:text-white font-bold tracking-wider text-sm sm:text-base">{originName}</span></div>
                  <div className="col-span-3 sm:col-span-4 truncate"><span className="text-slate-900 dark:text-white font-bold tracking-wider text-sm sm:text-base">{destName}</span></div>
                  <div className="col-span-3 sm:col-span-3 text-center"><span className={`${getStatusColor(status)} font-bold bg-slate-100 dark:bg-amber-500/10 px-2 py-0.5 rounded`}>{status}</span></div>
               </div>
             );
          })}
       </div>
    </div>
  );
};
