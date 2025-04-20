import React, { createContext, useContext, useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useChatStore();
  const [isDarkMode, setIsDarkMode] = useState(settings.darkMode);

  // Apply theme immediately on mount
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsDarkMode(settings.darkMode);
  }, []);

  // Apply dark mode class to document when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Update store when dark mode changes
  useEffect(() => {
    setIsDarkMode(settings.darkMode);
  }, [settings.darkMode]);

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !isDarkMode });
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 