import React, { createContext, useState, useCallback, useContext } from 'react';
import { favoriteService } from '../services/otherServices';
import { useAuth } from './AuthContext';

export const EventContext = createContext(null);

/**
 * Tracks which event IDs the current user has saved, so any card/list
 * across the app can show an accurate heart/save icon without an extra
 * network call per item.
 */
export const EventProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [savedEventIds, setSavedEventIds] = useState(new Set());

  const refreshSavedEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedEventIds(new Set());
      return;
    }
    try {
      const { events } = await favoriteService.getFavorites();
      setSavedEventIds(new Set(events.map((e) => e._id)));
    } catch (e) {
      // Non-fatal - favorites badge just won't be pre-populated
    }
  }, [isAuthenticated]);

  const toggleSaved = async (eventId) => {
    const isSaved = savedEventIds.has(eventId);
    // Optimistic update
    setSavedEventIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(eventId) : next.add(eventId);
      return next;
    });
    try {
      if (isSaved) {
        await favoriteService.removeFavorite(eventId);
      } else {
        await favoriteService.addFavorite(eventId);
      }
    } catch (e) {
      // Roll back on failure
      setSavedEventIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(eventId) : next.delete(eventId);
        return next;
      });
      throw e;
    }
  };

  return (
    <EventContext.Provider
      value={{ savedEventIds, refreshSavedEvents, toggleSaved, isSaved: (id) => savedEventIds.has(id) }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within an EventProvider');
  return ctx;
};
