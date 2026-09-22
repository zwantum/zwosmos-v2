import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type Theme = 'dark' | 'sepia' | 'light';

interface ThemeContextType {
  theme: Theme;
  isLight: boolean;
  isSepia: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('zwosmos_theme');
    return (saved === 'light' || saved === 'dark' || saved === 'sepia') ? saved : 'dark';
  });

  const directionRef = useRef<'forward' | 'backward'>('forward');

  useEffect(() => {
    localStorage.setItem('zwosmos_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    document.body.classList.remove('dark-theme', 'sepia-theme', 'light-theme');
    if (theme === 'sepia') {
      document.body.classList.add('sepia-theme');
    } else if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.add('dark-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'dark') {
        directionRef.current = 'forward';
        return 'sepia';
      }
      if (prev === 'light') {
        directionRef.current = 'backward';
        return 'sepia';
      }
      // Currently in 'sepia'
      if (directionRef.current === 'backward') {
        return 'dark';
      } else {
        return 'light';
      }
    });
  };

  const setTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') directionRef.current = 'forward';
    if (newTheme === 'light') directionRef.current = 'backward';
    setThemeState(newTheme);
  };

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';
  // isLight is true for both 'light' and 'sepia' so that all typography, text colors,
  // post cards, borders, shadows, and aurora use the exact same color combination as Light mode.
  const isLight = !isDark;

  return (
    <ThemeContext.Provider value={{ theme, isLight, isSepia, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      theme: 'dark',
      isLight: false,
      isSepia: false,
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {}
    };
  }
  return context;
};
