
import { TransportMode, LocationData } from './types';
import { Footprints, Bike, Car, Train, Plane, Ship } from 'lucide-react';
import { Language } from './translations';

// Color palette designed for both light and dark modes
export const MODE_CONFIG = {
  [TransportMode.WALK]: { 
    icon: Footprints, 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bg: 'bg-emerald-100 dark:bg-emerald-500/20' 
  },
  [TransportMode.CYCLE]: { 
    icon: Bike, 
    color: 'text-orange-600 dark:text-orange-400', 
    bg: 'bg-orange-100 dark:bg-orange-500/20' 
  },
  [TransportMode.CAR]: { 
    icon: Car, 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-100 dark:bg-blue-500/20' 
  },
  [TransportMode.TRAIN]: { 
    icon: Train, 
    color: 'text-purple-600 dark:text-purple-400', 
    bg: 'bg-purple-100 dark:bg-purple-500/20' 
  },
  [TransportMode.PLANE]: { 
    icon: Plane, 
    color: 'text-sky-600 dark:text-sky-400', 
    bg: 'bg-sky-100 dark:bg-sky-500/20' 
  },
  [TransportMode.BOAT]: { 
    icon: Ship, 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bg: 'bg-indigo-100 dark:bg-indigo-500/20' 
  },
};

// Simplified mock database of locations for demo purposes
// Now includes 'country' to ensure stats are calculated correctly
export const MOCK_LOCATIONS: Record<string, LocationData> = {
  'New York': { name: 'New York', name_zh: '纽约', name_pinyin: 'NIU YUE', code: 'JFK', coords: { lat: 40.7128, lng: -74.0060 }, country: 'United States' },
  'London': { name: 'London', name_zh: '伦敦', name_pinyin: 'LUN DUN', code: 'LHR', coords: { lat: 51.5074, lng: -0.1278 }, country: 'United Kingdom' },
  'Tokyo': { name: 'Tokyo', name_zh: '东京', name_pinyin: 'DONG JING', code: 'HND', coords: { lat: 35.6762, lng: 139.6503 }, country: 'Japan' },
  'Paris': { name: 'Paris', name_zh: '巴黎', name_pinyin: 'BA LI', code: 'CDG', coords: { lat: 48.8566, lng: 2.3522 }, country: 'France' },
  'Singapore': { name: 'Singapore', name_zh: '新加坡', name_pinyin: 'XIN JIA PO', code: 'SIN', coords: { lat: 1.3521, lng: 103.8198 }, country: 'Singapore' },
  'Sydney': { name: 'Sydney', name_zh: '悉尼', name_pinyin: 'XI NI', code: 'SYD', coords: { lat: -33.8688, lng: 151.2093 }, country: 'Australia' },
  'Dubai': { name: 'Dubai', name_zh: '迪拜', name_pinyin: 'DI BAI', code: 'DXB', coords: { lat: 25.2048, lng: 55.2708 }, country: 'United Arab Emirates' },
  'Los Angeles': { name: 'Los Angeles', name_zh: '洛杉矶', name_pinyin: 'LUO SHAN JI', code: 'LAX', coords: { lat: 34.0522, lng: -118.2437 }, country: 'United States' },
  'Shanghai': { name: 'Shanghai', name_zh: '上海', name_pinyin: 'SHANG HAI', code: 'PVG', coords: { lat: 31.2304, lng: 121.4737 }, country: 'China' },
  'Beijing': { name: 'Beijing', name_zh: '北京', name_pinyin: 'BEI JING', code: 'PEK', coords: { lat: 39.9042, lng: 116.4074 }, country: 'China' },
  'Hong Kong': { name: 'Hong Kong', name_zh: '香港', name_pinyin: 'XIANG GANG', code: 'HKG', coords: { lat: 22.3193, lng: 114.1694 }, country: 'China' },
  'Vancouver': { name: 'Vancouver', name_zh: '温哥华', name_pinyin: 'WEN GE HUA', code: 'YVR', coords: { lat: 49.2827, lng: -123.1207 }, country: 'Canada' },
  'Toronto': { name: 'Toronto', name_zh: '多伦多', name_pinyin: 'DUO LUN DUO', code: 'YYZ', coords: { lat: 43.6532, lng: -79.3832 }, country: 'Canada' },
  'Bangkok': { name: 'Bangkok', name_zh: '曼谷', name_pinyin: 'MAN GU', code: 'BKK', coords: { lat: 13.7563, lng: 100.5018 }, country: 'Thailand' },
  'Seoul': { name: 'Seoul', name_zh: '首尔', name_pinyin: 'SHOU ER', code: 'ICN', coords: { lat: 37.5665, lng: 126.9780 }, country: 'South Korea' },
};

// Country Name Normalization Map
export const COUNTRY_MAPPING: Record<string, string> = {
  '中国': 'China',
  'China': 'China',
  "People's Republic of China": 'China',
  'PRC': 'China',
  'CN': 'China',
  'USA': 'United States',
  'United States': 'United States',
  'United States of America': 'United States',
  'US': 'United States',
  '美国': 'United States',
  'Japan': 'Japan',
  '日本': 'Japan',
  'JP': 'Japan',
  'United Kingdom': 'United Kingdom',
  'UK': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  '英国': 'United Kingdom',
  'France': 'France',
  '法国': 'France',
  'Germany': 'Germany',
  'Deutschland': 'Germany',
  '德国': 'Germany',
  'Singapore': 'Singapore',
  '新加坡': 'Singapore',
  'Australia': 'Australia',
  '澳大利亚': 'Australia',
  'Canada': 'Canada',
  '加拿大': 'Canada',
  'Thailand': 'Thailand',
  '泰国': 'Thailand',
  'South Korea': 'South Korea',
  'Korea': 'South Korea',
  '韩国': 'South Korea',
  'United Arab Emirates': 'United Arab Emirates',
  'UAE': 'United Arab Emirates',
  '阿联酋': 'United Arab Emirates'
};

// Map normalized English names back to Chinese for display
export const COUNTRY_DISPLAY_ZH: Record<string, string> = {
  'China': '中国',
  'United States': '美国',
  'Japan': '日本',
  'United Kingdom': '英国',
  'France': '法国',
  'Germany': '德国',
  'Singapore': '新加坡',
  'Australia': '澳大利亚',
  'Canada': '加拿大',
  'Thailand': '泰国',
  'South Korea': '韩国',
  'United Arab Emirates': '阿联酋'
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

// Helper to get localized name
export const getLocalizedName = (location: LocationData, lang: Language): string => {
  if (lang === 'zh') {
    // 1. If the trip object already has the translated name, return it
    if (location.name_zh) return location.name_zh;
    
    // 2. Try to lookup in MOCK_LOCATIONS based on code or english name
    const mock = Object.values(MOCK_LOCATIONS).find(l => 
      (l.code && l.code === location.code) || l.name === location.name
    );
    if (mock && mock.name_zh) return mock.name_zh;
  }
  return location.name;
};
