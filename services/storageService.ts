
import { Trip, AppSettings } from '../types';
import Papa from 'papaparse';

const TRIPS_KEY = 'voyager_trips';
const SETTINGS_KEY = 'voyager_settings';

export const getTrips = (): Trip[] => {
  const data = localStorage.getItem(TRIPS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTrips = (trips: Trip[]) => {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
};

export const addTrip = (tripOrTrips: Trip | Trip[]) => {
  const trips = getTrips();
  if (Array.isArray(tripOrTrips)) {
      trips.unshift(...tripOrTrips);
  } else {
      trips.unshift(tripOrTrips);
  }
  saveTrips(trips);
};

export const updateTrip = (updatedTrip: Trip) => {
  const trips = getTrips();
  const index = trips.findIndex(t => t.id === updatedTrip.id);
  if (index !== -1) {
    trips[index] = updatedTrip;
    saveTrips(trips);
  }
};

export const deleteTrip = (id: string) => {
  const trips = getTrips().filter(t => t.id !== id);
  saveTrips(trips);
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : {};
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const exportToCSV = (): string => {
  const trips = getTrips();
  const flattenTrips = trips.map(t => ({
    id: t.id,
    mode: t.mode,
    origin_name: t.origin.name,
    origin_code: t.origin.code,
    origin_lat: t.origin.coords.lat,
    origin_lng: t.origin.coords.lng,
    origin_city: t.origin.city,
    origin_state: t.origin.state,
    origin_country: t.origin.country,
    destination_name: t.destination.name,
    destination_code: t.destination.code,
    destination_lat: t.destination.coords.lat,
    destination_lng: t.destination.coords.lng,
    destination_city: t.destination.city,
    destination_state: t.destination.state,
    destination_country: t.destination.country,
    startDate: t.startDate,
    arrivalDate: t.arrivalDate,
    returnStartDate: t.returnStartDate,
    returnArrivalDate: t.returnArrivalDate,
    endDate: t.endDate,
    isRoundTrip: t.isRoundTrip,
    distanceKm: t.distanceKm,
    durationHours: t.durationHours,
    relatedDate: t.relatedDate,
    status: t.status || 'ARRIVED'
  }));
  return Papa.unparse(flattenTrips);
};

export const importFromCSV = (csvString: string): Trip[] => {
  const results = Papa.parse(csvString, { header: true });
  const trips: Trip[] = results.data
    .filter((row: any) => row.id && row.mode) 
    .map((row: any) => ({
      id: row.id,
      mode: row.mode,
      origin: {
        name: row.origin_name,
        code: row.origin_code,
        coords: { lat: parseFloat(row.origin_lat), lng: parseFloat(row.origin_lng) },
        city: row.origin_city,
        state: row.origin_state,
        country: row.origin_country
      },
      destination: {
        name: row.destination_name,
        code: row.destination_code,
        coords: { lat: parseFloat(row.destination_lat), lng: parseFloat(row.destination_lng) },
        city: row.destination_city,
        state: row.destination_state,
        country: row.destination_country
      },
      startDate: row.startDate,
      arrivalDate: row.arrivalDate || undefined,
      returnStartDate: row.returnStartDate || undefined,
      returnArrivalDate: row.returnArrivalDate || undefined,
      endDate: row.endDate || undefined,
      isRoundTrip: row.isRoundTrip === 'true' || row.isRoundTrip === true,
      distanceKm: parseInt(row.distanceKm),
      durationHours: parseFloat(row.durationHours),
      relatedDate: row.relatedDate || undefined,
      status: row.status || 'ARRIVED'
    }));
  return trips;
};
