'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('imana-admin-theme', next);
    setTheme(next);
  };
  return <button className="icon-button" type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>;
}
