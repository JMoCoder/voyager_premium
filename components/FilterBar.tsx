

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Calendar, MapPin, Building2, X, Map, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { translations, Language } from '../translations';
import { Trip, FilterState } from '../types';

interface FilterBarProps {
  trips: Trip[];
  onFilterChange: (filters: FilterState) => void;
  lang: Language;
  onToggle?: (isOpen: boolean) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ trips, onFilterChange, lang, onToggle }) => {
  const t = translations[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Filters
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Extract Data for Filter Lists
  const filterData = useMemo(() => {
    const years = new Set<string>();
    const countries = new Set<string>();
    const provinces = new Set<string>();
    const cities = new Set<string>();

    trips.forEach(trip => {
      // Years
      if (trip.startDate) years.add(trip.startDate.split('-')[0]);
      
      // Countries
      if (trip.origin.country) countries.add(trip.origin.country);
      if (trip.destination.country) countries.add(trip.destination.country);
      
      // Provinces
      if (trip.origin.state) provinces.add(trip.origin.state);
      if (trip.destination.state) provinces.add(trip.destination.state);

      // Cities (Using name or city field)
      const originCity = trip.origin.city || trip.origin.name;
      const destCity = trip.destination.city || trip.destination.name;
      cities.add(originCity);
      cities.add(destCity);
    });

    return {
      years: Array.from(years).sort().reverse(),
      countries: Array.from(countries).sort(),
      provinces: Array.from(provinces).sort(),
      cities: Array.from(cities).sort()
    };
  }, [trips]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync open state with parent
  useEffect(() => {
    if (onToggle) onToggle(isOpen);
  }, [isOpen, onToggle]);

  // Update Parent
  useEffect(() => {
    onFilterChange({
      years: selectedYears,
      countries: selectedCountries,
      provinces: selectedProvinces,
      cities: selectedCities,
      search: searchText
    });
  }, [selectedYears, selectedCountries, selectedProvinces, selectedCities, searchText, onFilterChange]);

  const toggleSelection = (set: Set<string>, item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const newSet = new Set(set);
    if (newSet.has(item)) newSet.delete(item);
    else newSet.add(item);
    setter(Array.from(newSet));
  };

  const clearFilters = () => {
    setSelectedYears([]);
    setSelectedCountries([]);
    setSelectedProvinces([]);
    setSelectedCities([]);
    setSearchText('');
  };

  const hasActiveFilters = selectedYears.length > 0 || selectedCountries.length > 0 || selectedProvinces.length > 0 || selectedCities.length > 0 || searchText.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full mx-auto transition-all duration-300 ease-in-out ${isOpen ? 'max-w-full' : 'max-w-lg'}`}>
      {/* Search Input */}
      <div 
        className={`
          flex items-center w-full h-12 px-4 bg-slate-100 dark:bg-slate-800/50 
          border border-transparent focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-slate-800
          focus-within:ring-2 focus-within:ring-blue-500/20
          rounded-full transition-all duration-300
          ${isOpen ? 'rounded-b-none bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : ''}
        `}
        onClick={() => setIsOpen(true)}
      >
        <Search size={18} className="text-slate-400 mr-3" />
        <input 
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        {hasActiveFilters && (
          <button 
            onClick={(e) => { e.stopPropagation(); clearFilters(); }}
            className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Expanded Dropdown */}
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-800 border-x border-b border-slate-200 dark:border-slate-700 rounded-b-3xl shadow-2xl z-50 overflow-hidden animate-slide-up origin-top">
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 scrollbar-hide">
            
            {/* Years Section */}
            {filterData.years.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <Calendar size={14} className="mr-1.5" /> {t.filterYear}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterData.years.map(year => (
                    <button
                      key={year}
                      onClick={() => toggleSelection(new Set(selectedYears), year, setSelectedYears)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                        ${selectedYears.includes(year) 
                          ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/30' 
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'}
                      `}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Countries Section */}
            {filterData.countries.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <MapPin size={14} className="mr-1.5" /> {t.filterCountry}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterData.countries.map(country => (
                    <button
                      key={country}
                      onClick={() => toggleSelection(new Set(selectedCountries), country, setSelectedCountries)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium border transition-all truncate max-w-[150px]
                        ${selectedCountries.includes(country) 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'}
                      `}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Provinces Section */}
            {filterData.provinces.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <Map size={14} className="mr-1.5" /> {t.filterProvince}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterData.provinces.map(prov => (
                    <button
                      key={prov}
                      onClick={() => toggleSelection(new Set(selectedProvinces), prov, setSelectedProvinces)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium border transition-all truncate max-w-[150px]
                        ${selectedProvinces.includes(prov) 
                          ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/30' 
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'}
                      `}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cities Section (Limited to top 20 to prevent clutter) */}
            {filterData.cities.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <Building2 size={14} className="mr-1.5" /> {t.filterCity}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filterData.cities.slice(0, 20).map(city => (
                    <button
                      key={city}
                      onClick={() => toggleSelection(new Set(selectedCities), city, setSelectedCities)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium border transition-all truncate max-w-[150px]
                        ${selectedCities.includes(city) 
                          ? 'bg-purple-500 border-purple-500 text-white shadow-md shadow-purple-500/30' 
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300'}
                      `}
                    >
                      {city}
                    </button>
                  ))}
                  {filterData.cities.length > 20 && (
                     <span className="text-xs text-slate-400 self-center">+{filterData.cities.length - 20} more</span>
                  )}
                </div>
              </div>
            )}

          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 text-center border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-center">
             <ChevronDownIcon size={12} className="mr-1.5 animate-bounce" />
             {t.searchFooterHint || 'Pull down screen to create trip'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;