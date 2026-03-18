import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Preloader from '../components/Preloader';

const PreloaderContext = createContext();

export const usePreloader = () => useContext(PreloaderContext);

export const PreloaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownInitial, setHasShownInitial] = useState(false);

  // Effect to handle the initial website load (reload)
  useEffect(() => {
    // Check if we've already shown the preloader in this session
    const shown = sessionStorage.getItem('initialPreloaderShown');
    if (!shown) {
      setIsLoading(true);
      sessionStorage.setItem('initialPreloaderShown', 'true');
      setHasShownInitial(true);
    }
  }, []);

  const showPreloader = useCallback(() => {
    // Only allow showing preloader if it hasn't been shown in this session yet
    // or if explicitly called (though user wants to restrict it)
    if (!sessionStorage.getItem('initialPreloaderShown')) {
      setIsLoading(true);
    }
  }, []);

  const hidePreloader = useCallback(() => setIsLoading(false), []);

  return (
    <PreloaderContext.Provider value={{ isLoading, showPreloader, hidePreloader }}>
      {isLoading && <Preloader onComplete={hidePreloader} />}
      {children}
    </PreloaderContext.Provider>
  );
}; 