import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAllLocations, LocationRecord } from '../database/locationDB';

interface LocationContextType {
  isTrackingActive: boolean;
  setIsTrackingActive: (val: boolean) => void;
  locationCount: number;
  lastLocations: LocationRecord[];
  refreshLocations: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  isTrackingActive: false,
  setIsTrackingActive: () => {},
  locationCount: 0,
  lastLocations: [],
  refreshLocations: async () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [locationCount, setLocationCount] = useState(0);
  const [lastLocations, setLastLocations] = useState<LocationRecord[]>([]);

  const refreshLocations = useCallback(async () => {
    const locs = await getAllLocations();
    setLastLocations(locs);
    setLocationCount(locs.length);
  }, []);

  useEffect(() => {
    refreshLocations();
  }, [refreshLocations]);

  return (
    <LocationContext.Provider
      value={{
        isTrackingActive,
        setIsTrackingActive,
        locationCount,
        lastLocations,
        refreshLocations,
      }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}