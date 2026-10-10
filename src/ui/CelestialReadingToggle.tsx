import React, { useState, useEffect, useMemo, useId, useRef } from 'react';
import { useTheme, Theme } from '../contexts/ThemeContext';
import './CelestialReadingToggle.css';

export type ReadingMode = 'night' | 'sepia' | 'day';

const MODES: ReadingMode[] = ['night', 'sepia', 'day'];
const NAMES: Record<ReadingMode, string> = {
  night: 'Night',
  sepia: 'Sepia',
  day: 'Day'
};

const MODE_TO_THEME: Record<ReadingMode, Theme> = {
  night: 'dark',
  sepia: 'sepia',
  day: 'light'
};

const THEME_TO_MODE: Record<Theme, ReadingMode> = {
  dark: 'night',
  sepia: 'sepia',
  light: 'day'
};

/* Low-precision solar/lunar coordinates, sufficient for a tiny phase icon.
   Adapted from SunCalc 1.9.0 by Vladimir Agafonkin (BSD-2-Clause).
   https://github.com/mourner/suncalc/tree/v1.9.0
   Calculates real lunar phase illumination. North-up schematic orientation; no location or permissions used. */
function moonIllumination(date: Date) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 0.5 + 2440588 - 2451545;
  const e = rad * 23.4397;
  const ra = (l: number, b: number) =>
    Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  const dec = (l: number, b: number) =>
    Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const M = rad * (357.5291 + 0.98560028 * d);
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const sunL = M + C + rad * 102.9372 + Math.PI;
  const L = rad * (218.316 + 13.176396 * d);
  const moonM = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.229350 * d);
  const moonL = L + rad * 6.289 * Math.sin(moonM);
  const moonB = rad * 5.128 * Math.sin(F);
  const distance = 385001 - 20905 * Math.cos(moonM);
  const sRA = ra(sunL, 0);
  const sDec = dec(sunL, 0);
  const mRA = ra(moonL, moonB);
  const mDec = dec(moonL, moonB);
  const separation = Math.acos(
    Math.max(-1, Math.min(1, Math.sin(sDec) * Math.sin(mDec) + Math.cos(sDec) * Math.cos(mDec) * Math.cos(sRA - mRA)))
  );
  const incidence = Math.atan2(
    149598000 * Math.sin(separation),
    distance - 149598000 * Math.cos(separation)
  );
  const angle = Math.atan2(
    Math.cos(sDec) * Math.sin(sRA - mRA),
    Math.sin(sDec) * Math.cos(mDec) - Math.cos(sDec) * Math.sin(mDec) * Math.cos(sRA - mRA)
  );
  return {
    fraction: (1 + Math.cos(incidence)) / 2,
    phase: 0.5 + (0.5 * incidence * (angle < 0 ? -1 : 1)) / Math.PI
  };
}

function getMoonData(date: Date) {
  const { fraction, phase } = moonIllumination(date);
  const r = 8.2;
  const side = phase <= 0.5 ? 1 : -1;
  const points: string[] = [];

  // A spherical terminator, not a straight wipe across the disc
  for (let i = 0; i <= 64; i++) {
    const y = -r + (2 * r * i) / 64;
    const x = Math.sqrt(Math.max(0, r * r - y * y));
    points.push(`${(12 + side * x).toFixed(3)},${(12 + y).toFixed(3)}`);
  }
  for (let i = 64; i >= 0; i--) {
    const y = -r + (2 * r * i) / 64;
    const x = Math.sqrt(Math.max(0, r * r - y * y));
    points.push(`${(12 + side * (1 - 2 * fraction) * x).toFixed(3)},${(12 + y).toFixed(3)}`);
  }

  const names = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent'
  ];
  const name = names[Math.round(phase * 8) % 8];

  return {
    points: points.join(' '),
    detail: `${name} · ${Math.round(fraction * 100)}% illuminated`
  };
}

function getSunData(date: Date) {
  const h = date.getHours() + date.getMinutes() / 60;
  let cy = 12;
  let horizon = 0;
  let colour = '#ffce57';
  let detail = 'Sun · standard night-time symbol';

  if (h >= 6 && h < 9) {
    cy = 16 - ((h - 6) / 3) * 4;
    horizon = 1;
    colour = '#ffb563';
    detail = 'Sun · rising';
  } else if (h >= 9 && h < 11) {
    cy = 12 - (h - 9);
    horizon = 1 - (h - 9) / 2;
    detail = 'Sun · morning';
  } else if (h >= 11 && h < 14) {
    detail = 'Sun · midday';
  } else if (h >= 14 && h < 17) {
    cy = 10 + ((h - 14) / 3) * 2;
    horizon = (h - 14) / 3;
    detail = 'Sun · afternoon';
  } else if (h >= 17 && h < 19) {
    cy = 12 + ((h - 17) / 2) * 4;
    horizon = 1;
    colour = '#ffa45e';
    detail = 'Sun · setting';
  }

  const rays: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    rays.push(
      `M${(12 + Math.cos(a) * 6.1).toFixed(2)} ${(cy + Math.sin(a) * 6.1).toFixed(2)} L${(
        12 +
        Math.cos(a) * 8.3
      ).toFixed(2)} ${(cy + Math.sin(a) * 8.3).toFixed(2)}`
    );
  }

  return { cy, horizon, colour, detail, rays };
}

function getJupiterData() {
  return {
    detail: 'Jupiter · warm sepia reading'
  };
}

export interface CelestialReadingToggleProps {
  className?: string;
  style?: React.CSSProperties;
  onModeChange?: (mode: ReadingMode) => void;
}

export const CelestialReadingToggle: React.FC<CelestialReadingToggleProps> = ({
  className = '',
  style,
  onModeChange
}) => {
  const { theme, setTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const activeMode: ReadingMode = THEME_TO_MODE[theme] || 'night';

  const rawId = useId();
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const jupiterClipId = `zw-jup-${cleanId}`;
  const sunClipId = `zw-sun-${cleanId}`;

  const buttonRefs = useRef<{ [key in ReadingMode]?: HTMLButtonElement | null }>({});

  // Real-time astronomical updates every 60s, plus on tab focus and visibility change
  useEffect(() => {
    const updateTime = () => {
      if (!document.hidden) {
        setCurrentDate(new Date());
      }
    };

    const interval = window.setInterval(updateTime, 60000);
    const handleVisibility = () => {
      if (!document.hidden) updateTime();
    };
    const handleFocus = () => updateTime();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const moonData = useMemo(() => getMoonData(currentDate), [currentDate]);
  const jupiterData = useMemo(() => getJupiterData(), []);
  const sunData = useMemo(() => getSunData(currentDate), [currentDate]);

  const details: Record<ReadingMode, string> = {
    night: moonData.detail,
    sepia: jupiterData.detail,
    day: sunData.detail
  };

  const handleSelectMode = (mode: ReadingMode) => {
    const nextTheme = MODE_TO_THEME[mode];
    setTheme(nextTheme);
    if (onModeChange) onModeChange(mode);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, mode: ReadingMode) => {
    if (!['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    let index = MODES.indexOf(mode);
    if (event.key === 'Home') {
      index = 0;
    } else if (event.key === 'End') {
      index = 2;
    } else if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
      index = (index + 1) % 3;
    } else {
      index = (index - 1 + 3) % 3;
    }

    const nextMode = MODES[index];
    handleSelectMode(nextMode);
    buttonRefs.current[nextMode]?.focus();
  };

  return (
    <div
      className={`zw-reading-toggle ${className}`.trim()}
      data-zw-reading-toggle=""
      data-mode={activeMode}
      role="radiogroup"
      aria-label="Reading mode"
      style={style}
    >
      <span className="zw-reading-toggle__track" aria-hidden="true">
        <span className="zw-reading-toggle__knob">
          {activeMode === 'night' && (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="8.2" fill="#344054" />
              <polygon points={moonData.points} fill="#f4f2e9" />
              <circle cx="12" cy="12" r="8.2" fill="none" stroke="#9ca8bc" strokeWidth="0.7" />
            </svg>
          )}

          {activeMode === 'sepia' && (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id={jupiterClipId}>
                  <circle cx="12" cy="12" r="8.5" />
                </clipPath>
              </defs>
              <circle cx="12" cy="12" r="8.5" fill="#ecd2a8" />
              <g clipPath={`url(#${jupiterClipId})`} fill="#ad7750">
                <path d="M3 7.6 Q12 9.3 21 7.6 V10.1 Q12 11.5 3 10.1Z" />
                <path d="M3 13.1 Q12 14.5 21 13.1 V16 Q12 17.3 3 16Z" />
              </g>
              <circle cx="12" cy="12" r="8.5" fill="none" stroke="#efdbba" strokeWidth="0.6" />
            </svg>
          )}

          {activeMode === 'day' && (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id={sunClipId}>
                  <rect x="0" y="0" width="24" height={sunData.horizon > 0 ? 16 : 24} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${sunClipId})`}>
                <g stroke={sunData.colour} strokeWidth="1.4" strokeLinecap="round">
                  {sunData.rays.map((d, idx) => (
                    <path key={idx} d={d} />
                  ))}
                </g>
                <circle cx="12" cy={sunData.cy} r="4.3" fill={sunData.colour} />
              </g>
              <path
                d="M3.5 16.5 H20.5"
                stroke="#c1cbd9"
                strokeWidth="1.3"
                strokeLinecap="round"
                opacity={sunData.horizon}
              />
            </svg>
          )}
        </span>
      </span>

      <div className="zw-reading-toggle__options">
        {MODES.map(mode => {
          const isSelected = mode === activeMode;
          const detail = details[mode];

          return (
            <button
              key={mode}
              ref={el => {
                buttonRefs.current[mode] = el;
              }}
              className="zw-reading-toggle__option"
              type="button"
              role="radio"
              data-zw-mode={mode}
              aria-checked={isSelected}
              aria-label={`${NAMES[mode]} reading mode. ${detail}.`}
              tabIndex={isSelected ? 0 : -1}
              title={`${NAMES[mode]} · ${detail}`}
              onClick={() => handleSelectMode(mode)}
              onKeyDown={e => handleKeyDown(e, mode)}
            >
              <span className="zw-reading-toggle__icon" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CelestialReadingToggle;
