
import React, { useState, useEffect, useRef } from 'react';
import { TransportMode, LocationData, Trip, LocationSuggestion, TripStatus } from '../types';
import { MODE_CONFIG, MOCK_LOCATIONS, calculateDistance } from '../constants';
import { translations, Language } from '../translations';
import { searchLocations } from '../services/geocoding';
import { X, MapPin, ArrowRight, ArrowLeftRight, Loader2, Search, Calendar, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from './DatePicker';

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trips: Trip[]) => void; 
  lang: Language;
  initialData?: Trip;
}

const AddTripModal: React.FC<AddTripModalProps> = ({ isOpen, onClose, onSave, lang, initialData }) => {
  if (!isOpen) return null;

  const t = translations[lang];
  const [mode, setMode] = useState<TransportMode>(TransportMode.PLANE);
  
  // Location Input States
  const [originQuery, setOriginQuery] = useState('');
  const [originData, setOriginData] = useState<LocationData | null>(null);
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);

  const [destQuery, setDestQuery] = useState('');
  const [destData, setDestData] = useState<LocationData | null>(null);
  const [destSuggestions, setDestSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // Debounce refs
  const originTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Date States
  const [startDate, setStartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  
  // Date Picker Visibility States
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to extract YYYY-MM-DD from ISO string
  const extractDate = (iso?: string) => {
    if (!iso) return '';
    return iso.split('T')[0];
  };

  // Helper to format date for display
  const formatDateDisplay = (isoDate: string) => {
    if (!isoDate) return lang === 'zh' ? '选择日期' : 'Select Date';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    
    if (lang === 'zh') {
       return `${y}年 ${m}月 ${d}日`;
    } else {
       return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  useEffect(() => {
    if (initialData) {
      setMode(initialData.mode);
      setOriginQuery(lang === 'zh' && initialData.origin.name_zh ? initialData.origin.name_zh : initialData.origin.name);
      setOriginData(initialData.origin);
      
      setDestQuery(lang === 'zh' && initialData.destination.name_zh ? initialData.destination.name_zh : initialData.destination.name);
      setDestData(initialData.destination);

      setIsRoundTrip(initialData.isRoundTrip);

      setStartDate(extractDate(initialData.startDate));
      setReturnDate(extractDate(initialData.relatedDate || initialData.returnStartDate));
      
    } else {
      setMode(TransportMode.PLANE);
      setOriginQuery(''); setOriginData(null);
      setDestQuery(''); setDestData(null);
      setIsRoundTrip(false);
      setStartDate('');
      setReturnDate('');
    }
  }, [initialData, isOpen, lang]);

  // Search Logic
  const handleSearch = (query: string, type: 'origin' | 'dest') => {
    // 1. Immediate Mock Search (High quality preset)
    const mockResults = query.length >= 1 ? Object.values(MOCK_LOCATIONS).filter(l => 
            l.name.toLowerCase().includes(query.toLowerCase()) || 
            (l.name_zh && l.name_zh.includes(query)) ||
            (l.code && l.code.toLowerCase().includes(query.toLowerCase()))
    ).map(l => ({
        place_id: Math.random(),
        lat: l.coords.lat.toString(),
        lon: l.coords.lng.toString(),
        display_name: lang === 'zh' ? (l.name_zh || l.name) : l.name,
        address: { 
            city: l.city || l.name, 
            state: l.state,
            country: l.country
        },
        isMock: true,
        original: l
    })) : [];

    // Set immediate results
    if (type === 'origin') {
        setOriginQuery(query);
        setOriginSuggestions(mockResults as any);
        setIsSearchingOrigin(true);
        setShowOriginDropdown(true);
        if (originTimeout.current) clearTimeout(originTimeout.current);
    } else {
        setDestQuery(query);
        setDestSuggestions(mockResults as any);
        setIsSearchingDest(true);
        setShowDestDropdown(true);
        if (destTimeout.current) clearTimeout(destTimeout.current);
    }

    // 2. Debounced Online Search
    const timeout = setTimeout(async () => {
        if (!query || query.length < 2) {
             if (type === 'origin') setIsSearchingOrigin(false);
             else setIsSearchingDest(false);
             return;
        }

        const onlineResults = await searchLocations(query, lang);
        
        // Merge: Mock first, then online (deduplicate by name roughly)
        const existingNames = new Set(mockResults.map(m => m.display_name));
        const newResults = onlineResults.filter(r => !existingNames.has(r.display_name));
        const combined = [...mockResults, ...newResults];
        
        if (type === 'origin') {
            setOriginSuggestions(combined as any);
            setIsSearchingOrigin(false);
        } else {
            setDestSuggestions(combined as any);
            setIsSearchingDest(false);
        }
    }, 500); 

    if (type === 'origin') originTimeout.current = timeout;
    else destTimeout.current = timeout;
  };

  const handleSelectLocation = (suggestion: any, type: 'origin' | 'dest') => {
     let location: LocationData;

     if (suggestion.isMock) {
         location = suggestion.original;
     } else {
         const addr = suggestion.address || {};
         
         // 1. DISPLAY NAME: The specific place the user chose (e.g., "Brooklyn", "Shinjuku")
         const displayName = 
             addr.suburb || 
             addr.district || 
             addr.town || 
             addr.village || 
             addr.city || 
             suggestion.display_name.split(',')[0];

         // 2. STATISTICAL LEVEL 3 (CITY)
         const statCity = 
            addr.city || 
            addr.town || 
            addr.municipality || 
            addr.village || 
            addr.county || 
            displayName;

         // 3. STATISTICAL LEVEL 2 (STATE)
         const statState = 
            addr.state || 
            addr.province || 
            addr.region || 
            addr.state_district;

         location = {
             name: displayName,
             name_zh: displayName, 
             code: displayName.substring(0, 3).toUpperCase(), 
             coords: {
                 lat: parseFloat(suggestion.lat),
                 lng: parseFloat(suggestion.lon)
             },
             country: addr.country, 
             state: statState,      
             city: statCity         
         };
     }

     if (type === 'origin') {
         setOriginData(location);
         setOriginQuery(lang === 'zh' && location.name_zh ? location.name_zh : location.name);
         setShowOriginDropdown(false);
     } else {
         setDestData(location);
         setDestQuery(lang === 'zh' && location.name_zh ? location.name_zh : location.name);
         setShowDestDropdown(false);
     }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!originData || !destData) {
        alert("Please select a valid location from the list.");
        return;
    }
    if (!startDate) {
        alert(t.fillDatesError);
        return;
    }
    if (isRoundTrip && !returnDate) {
        alert(t.fillDatesError);
        return;
    }

    const distanceOneWay = calculateDistance(originData.coords.lat, originData.coords.lng, destData.coords.lat, destData.coords.lng);
    const tripsToSave: Trip[] = [];
    
    // Auto Calculate Status based on Date vs Today
    const calculateStatus = (tripDate: string): TripStatus => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        if (tripDate === todayStr) return 'TRAVELING';
        if (tripDate < todayStr) return 'ARRIVED';
        return 'PLAN';
    };

    if (initialData) {
        // EDIT MODE
        const updatedStatus = calculateStatus(startDate);
        const updatedTrip: Trip = {
            ...initialData,
            mode,
            origin: originData,
            destination: destData,
            startDate: startDate,
            distanceKm: distanceOneWay,
            relatedDate: isRoundTrip ? returnDate : undefined,
            isRoundTrip: isRoundTrip,
            status: updatedStatus
        };
        tripsToSave.push(updatedTrip);
    } else {
        // CREATE MODE
        const outboundStatus = calculateStatus(startDate);
        const outboundTrip: Trip = {
            id: uuidv4(),
            mode,
            origin: originData,
            destination: destData,
            startDate: startDate,
            isRoundTrip: isRoundTrip,
            distanceKm: distanceOneWay,
            relatedDate: isRoundTrip ? returnDate : undefined,
            returnStartDate: isRoundTrip ? returnDate : undefined,
            status: outboundStatus 
        };
        tripsToSave.push(outboundTrip);

        if (isRoundTrip) {
            const inboundStatus = calculateStatus(returnDate);

            const inboundTrip: Trip = {
                id: uuidv4(),
                mode,
                origin: destData, 
                destination: originData, 
                startDate: returnDate, 
                isRoundTrip: isRoundTrip,
                distanceKm: distanceOneWay,
                relatedDate: startDate, 
                returnStartDate: startDate,
                status: inboundStatus
            };
            tripsToSave.push(inboundTrip);
        }
    }

    onSave(tripsToSave);
    onClose();
  };

  const LocationDropdown = ({ 
    suggestions, 
    loading, 
    onSelect 
  }: { 
    suggestions: LocationSuggestion[], 
    loading: boolean, 
    onSelect: (s: any) => void 
  }) => (
     <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
        {suggestions.map((s, idx) => (
            <button
               key={idx}
               type="button"
               onClick={() => onSelect(s)}
               className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors flex items-center group"
            >
               <div className={`p-2 rounded-lg mr-3 ${ (s as any).isMock ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' }`}>
                  <MapPin size={16} />
               </div>
               <div>
                   <div className="text-sm font-medium text-slate-900 dark:text-white">{s.display_name.split(',')[0]}</div>
                   <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{s.display_name}</div>
               </div>
               { (s as any).isMock && <div className="ml-auto text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">PRESET</div> }
            </button>
        ))}

        {loading && (
            <div className="p-3 flex items-center justify-center text-xs text-slate-400 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <Loader2 className="animate-spin mr-2" size={14} /> 
                {suggestions.length > 0 ? 'Loading more results...' : 'Searching online...'}
            </div>
        )}
        
        {!loading && suggestions.length === 0 && (
             <div className="p-4 text-center text-xs text-slate-400">No results found</div>
        )}
     </div>
  );

  return (
    <>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
        <div ref={modalRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-slide-up transition-colors duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{initialData ? t.editJourney : t.logJourney}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={20} />
            </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Transport Mode */}
            <div>
                <div className="grid grid-cols-6 gap-2">
                {Object.values(TransportMode).map((m) => {
                    const Config = MODE_CONFIG[m];
                    const Icon = Config.icon;
                    const isSelected = mode === m;
                    return (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                        isSelected 
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md dark:bg-blue-600/20 dark:border-blue-500 dark:text-white' 
                        : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Icon size={20} className={isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    </button>
                    );
                })}
                </div>
            </div>

            {/* Locations */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.transportMode}</label>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="roundtrip" className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${isRoundTrip ? 'text-blue-500' : 'text-slate-400'}`} onClick={() => setIsRoundTrip(!isRoundTrip)}>
                            {isRoundTrip ? t.roundTrip : t.oneWay}
                        </label>
                        <button 
                            type="button"
                            onClick={() => setIsRoundTrip(!isRoundTrip)}
                            className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isRoundTrip ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isRoundTrip ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                </div>

                <div className="flex items-start space-x-2">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16} />
                    <input 
                        type="text"
                        placeholder={t.fromPlaceholder}
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all"
                        value={originQuery}
                        onChange={(e) => handleSearch(e.target.value, 'origin')}
                        onFocus={() => { if(originQuery.length >= 1) setShowOriginDropdown(true); }}
                    />
                    {showOriginDropdown && (
                        <LocationDropdown 
                            suggestions={originSuggestions} 
                            loading={isSearchingOrigin} 
                            onSelect={(s) => handleSelectLocation(s, 'origin')} 
                        />
                    )}
                </div>

                <div className="flex items-center justify-center pt-2">
                    <ArrowLeftRight size={16} className="text-slate-300 dark:text-slate-600" />
                </div>

                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16} />
                    <input 
                        type="text"
                        placeholder={t.toPlaceholder}
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all"
                        value={destQuery}
                        onChange={(e) => handleSearch(e.target.value, 'dest')}
                        onFocus={() => { if(destQuery.length >= 1) setShowDestDropdown(true); }}
                    />
                    {showDestDropdown && (
                        <LocationDropdown 
                            suggestions={destSuggestions} 
                            loading={isSearchingDest} 
                            onSelect={(s) => handleSelectLocation(s, 'dest')} 
                        />
                    )}
                </div>
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{t.departure}</label>
                   <button
                        type="button"
                        onClick={() => setShowStartDatePicker(true)}
                        className="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                   >
                       <span className={startDate ? 'font-medium' : 'text-slate-400'}>{formatDateDisplay(startDate)}</span>
                       <Calendar size={16} className="text-slate-400" />
                   </button>
                </div>

                <div className={`transition-opacity duration-300 ${isRoundTrip ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{t.returnDate}</label>
                   <button
                        type="button"
                        onClick={() => setShowReturnDatePicker(true)}
                        disabled={!isRoundTrip}
                        className="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                   >
                       <span className={returnDate ? 'font-medium' : 'text-slate-400'}>{formatDateDisplay(returnDate)}</span>
                       <Calendar size={16} className="text-slate-400" />
                   </button>
                </div>
            </div>

            {/* Submit Button */}
            <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center"
            >
                {initialData ? t.saveChanges : t.createTrip}
                <ArrowRight size={20} className="ml-2" />
            </button>
            </form>
        </div>
        </div>

        {/* Date Picker Modals */}
        {showStartDatePicker && (
            <DatePicker 
                value={startDate} 
                onChange={setStartDate} 
                onClose={() => setShowStartDatePicker(false)} 
                lang={lang}
            />
        )}
        {showReturnDatePicker && (
            <DatePicker 
                value={returnDate} 
                onChange={setReturnDate} 
                onClose={() => setShowReturnDatePicker(false)} 
                lang={lang}
                minDate={startDate}
            />
        )}
    </>
  );
};

export default AddTripModal;
