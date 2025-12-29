
export enum TransportMode {
  WALK = 'WALK',
  CYCLE = 'CYCLE',
  CAR = 'CAR',
  TRAIN = 'TRAIN',
  PLANE = 'PLANE',
  BOAT = 'BOAT'
}

export type ViewMode = 'cards' | 'wallet' | 'list' | 'compact' | 'routes' | 'visited' | 'overview';

export type TripStatus = 'PLAN' | 'TRAVELING' | 'ARRIVED';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  name: string; 
  name_zh?: string; 
  name_pinyin?: string; 
  code?: string; 
  coords: Coordinates;
  country?: string; 
  state?: string;   
  city?: string;    
}

export interface LocationSuggestion {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    district?: string;
    province?: string;
    state?: string;
    region?: string;
    state_district?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
  };
}

export interface Trip {
  id: string;
  mode: TransportMode;
  origin: LocationData;
  destination: LocationData;
  startDate: string; 
  returnStartDate?: string; 
  arrivalDate?: string; 
  returnArrivalDate?: string;
  endDate?: string; 
  isRoundTrip: boolean;
  distanceKm: number;
  durationHours?: number; 
  notes?: string;
  relatedDate?: string; 
  relatedTripId?: string;
  status?: TripStatus;
  aiImage?: string; // Base64 or URL for AI generated illustration
}

export interface AppSettings {
  webdavUrl?: string;
  webdavUser?: string;
  webdavPassword?: string;
  language?: 'en' | 'zh';
  theme?: 'light' | 'dark' | 'system';
  username?: string;
}

export interface FilterState {
  years: string[];
  countries: string[];
  provinces: string[];
  cities: string[];
  search: string;
}
