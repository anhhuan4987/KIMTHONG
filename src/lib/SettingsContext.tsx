import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AppSettings } from '../types';
import { DEFAULT_PRODUCTS, SESSION_RATES, FISH_BUYBACK_PRICE, HOURLY_RATE } from '../constants';

const DEFAULT_SETTINGS: AppSettings = {
  packages: [
    { id: '1h', name: 'Ca 1 tiếng', duration: 1, price: SESSION_RATES['1h'] },
    { id: '5h', name: 'Ca 5 tiếng', duration: 5, price: SESSION_RATES['5h'] },
    { id: '10h', name: 'Ca 10 tiếng', duration: 10, price: SESSION_RATES['10h'] },
  ],
  products: DEFAULT_PRODUCTS.map((p, i) => ({ id: `p${i}`, ...p })),
  fishBuybackPrice: FISH_BUYBACK_PRICE,
  hourlyRate: HOURLY_RATE,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      } else {
        // Initialize with defaults if not exists
        setDoc(doc(db, 'settings', 'global'), DEFAULT_SETTINGS);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateSettings = async (newSettings: AppSettings) => {
    await setDoc(doc(db, 'settings', 'global'), newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
