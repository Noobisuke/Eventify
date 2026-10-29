import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_REGION } from '../constants/config';

/**
 * Requests foreground location permission and returns the user's current
 * coordinates. Falls back to DEFAULT_REGION if permission is denied or
 * location can't be determined, so map/nearby features degrade gracefully.
 */
export const useLocation = (autoRequest = true) => {
  const [coords, setCoords] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setCoords({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setPermissionDenied(false);
    } catch (error) {
      setCoords({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoRequest) requestLocation();
  }, [autoRequest, requestLocation]);

  return { coords, permissionDenied, isLoading, requestLocation };
};
