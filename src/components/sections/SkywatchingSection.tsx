import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './SkywatchingSection.css';

const rad = Math.PI / 180;
const norm = (n: number) => ((n % 360) + 360) % 360;
const sin = (n: number) => Math.sin(n * rad);
const cos = (n: number) => Math.cos(n * rad);
const localNoon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
const dateKey = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

function lunarAngle(moment: Date) {
  // Low-order solar/lunar ecliptic longitudes; intended for visual preview.
  const d = (moment.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const solarMean = norm(357.52911 + 0.98560028 * d);
  const sun = norm(280.46646 + 0.98564736 * d + 1.914602 * sin(solarMean) + 0.019993 * sin(2 * solarMean) + 0.000289 * sin(3 * solarMean));
  const lunarMean = norm(134.9633964 + 13.06499295 * d);
  const elong = norm(297.8501921 + 12.19074912 * d);
  const latArg = norm(93.272095 + 13.22935024 * d);
  const moon = norm(
    218.3164477 +
      13.17639648 * d +
      6.289 * sin(lunarMean) +
      1.274 * sin(2 * elong - lunarMean) +
      0.658 * sin(2 * elong) +
      0.214 * sin(2 * lunarMean) -
      0.186 * sin(solarMean) -
      0.114 * sin(2 * latArg)
  );
  return norm(moon - sun);
}

function phaseAt(date: Date) {
  const angle = lunarAngle(localNoon(date));
  const illumination = (1 - cos(angle)) / 2;
  const start = lunarAngle(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  const end = lunarAngle(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
  const sweep = norm(end - start);
  const major = ([
    [0, 'New Moon'],
    [90, 'First Quarter'],
    [180, 'Full Moon'],
    [270, 'Last Quarter'],
  ] as const).find(([target]) => norm(target - start) < sweep);
  const name = major?.[1] || (angle < 90 ? 'Waxing Crescent' : angle < 180 ? 'Waxing Gibbous' : angle < 270 ? 'Waning Gibbous' : 'Waning Crescent');
  return { name, illumination, waxing: angle < 180 };
}

function nextPhaseEvent(after: Date, target: number): Date {
  const distance = norm(target - lunarAngle(after)) || 360;
  let previous = after;
  let previousAngle = lunarAngle(after);
  let travelled = 0;
  for (let i = 0; i < 40; i++) {
    const next = new Date(previous.getTime() + 86400000);
    const nextAngle = lunarAngle(next);
    const step = norm(nextAngle - previousAngle);
    if (travelled + step >= distance) {
      let low = previous.getTime();
      let high = next.getTime();
      const needed = distance - travelled;
      for (let j = 0; j < 21; j++) {
        const middle = Math.floor((low + high) / 2);
        if (norm(lunarAngle(new Date(middle)) - previousAngle) < needed) low = middle;
        else high = middle;
      }
      return new Date(high);
    }
    travelled += step;
    previous = next;
    previousAngle = nextAngle;
  }
  return new Date();
}

function lastNewMoon(now: Date): Date {
  let event = nextPhaseEvent(new Date(now.getTime() - 36 * 86400000), 0);
  let last = event;
  while (event <= now) {
    last = event;
    event = nextPhaseEvent(new Date(event.getTime() + 1000), 0);
  }
  return last;
}

interface MoonSvgProps {
  illumination: number;
  waxing: boolean;
  hemisphere: 'north' | 'south';
  className?: string;
  idPrefix?: string;
}

function MoonSvg({ illumination, waxing, hemisphere, className = 'zw-sky-moon', idPrefix = 'm' }: MoonSvgProps) {
  const r = 35;
  const cx = 40;
  const cy = 40;
  const rightSide = waxing === (hemisphere === 'north');
  const k = Math.max(0, Math.min(1, illumination));
  const points: [number, number][] = [];

  for (let y = -r; y <= r; y += 1) {
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    const boundary = (rightSide ? 1 - 2 * k : 2 * k - 1) * half;
    points.push([cx + boundary, cy + y]);
  }
  const outer: [number, number][] = [];
  for (let y = r; y >= -r; y -= 1) {
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    outer.push([cx + (rightSide ? half : -half), cy + y]);
  }
  const pathD = [...points, ...outer].map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + ' Z';

  const diskId = `disk-${idPrefix}`;
  const lightId = `light-${idPrefix}`;
  const faceId = `face-${idPrefix}`;

  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={diskId}>
          <stop stopColor="#36475a" />
          <stop offset="1" stopColor="#17283b" />
        </radialGradient>
        <radialGradient id={lightId}>
          <stop stopColor="#f9f5e9" />
          <stop offset=".74" stopColor="#e6e4d9" />
          <stop offset="1" stopColor="#aaafae" />
        </radialGradient>
        <clipPath id={faceId}>
          <circle cx="40" cy="40" r="35" />
        </clipPath>
      </defs>
      <circle cx="40" cy="40" r="35" fill={`url(#${diskId})`} stroke="#8493a0" strokeOpacity=".38" />
      <path d={pathD} fill={`url(#${lightId})`} />
      <g clipPath={`url(#${faceId})`} fill="#7d8580" opacity=".13">
        <circle cx="28" cy="28" r="5" />
        <circle cx="50" cy="48" r="7" />
        <circle cx="46" cy="23" r="3" />
        <circle cx="24" cy="51" r="4" />
      </g>
    </svg>
  );
}

const shortPhaseMap: Record<string, string> = {
  'New Moon': 'New',
  'Waxing Crescent': 'Wax Cres',
  'First Quarter': '1st Qtr',
  'Waxing Gibbous': 'Wax Gib',
  'Full Moon': 'Full',
  'Waning Gibbous': 'Wan Gib',
  'Last Quarter': 'Last Qtr',
  'Waning Crescent': 'Wan Cres',
};

export const SkywatchingSection: React.FC = () => {
  const [hemisphere, setHemisphere] = useState<'north' | 'south'>(() => {
    return (localStorage.getItem('zwosmos-hemisphere') as 'north' | 'south') || 'north';
  });
  const [now, setNow] = useState<Date>(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  const locale = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

  // Tick clock to update if date changes or minutes pass
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        setNow(new Date());
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Prevent background scroll and allow Escape key to close calendar modal
  useEffect(() => {
    if (!isCalendarOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isCalendarOpen]);

  const handleHemisphere = (h: 'north' | 'south') => {
    setHemisphere(h);
    localStorage.setItem('zwosmos-hemisphere', h);
  };

  // Calculations for Today's Moon
  const todayData = useMemo(() => {
    const angle = lunarAngle(now);
    const illumination = (1 - cos(angle)) / 2;
    const phase = { ...phaseAt(now), illumination, waxing: angle < 180 };
    const shortDate = (d: Date) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(d);

    const fullDateLabel = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(now);

    const age = ((now.getTime() - lastNewMoon(now).getTime()) / 86400000).toFixed(1);
    const nextFull = shortDate(nextPhaseEvent(now, 180));
    const nextNew = shortDate(nextPhaseEvent(now, 0));

    return {
      phase,
      illuminationPct: Math.round(illumination * 100),
      fullDateLabel,
      age,
      nextFull,
      nextNew,
    };
  }, [now, locale]);

  // Strip 7 days
  const stripData = useMemo(() => {
    const end = addDays(now, 6);
    const startLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(now);
    const endLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(end);
    const rangeLabel = `${startLabel} – ${endLabel}`;

    const days = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(now, i);
      const p = phaseAt(day);
      const isToday = i === 0;
      const week = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day);
      const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(day);
      const pct = Math.round(p.illumination * 100);
      const short = shortPhaseMap[p.name] || p.name;
      return { day, p, isToday, week, month, pct, short, dayNum: day.getDate() };
    });

    return { rangeLabel, days };
  }, [now, locale]);

  // Monthly Calendar Grid
  const calendarData = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const offset = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const currentKey = dateKey(now);

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(y, m, d, 12);
      const p = phaseAt(day);
      const isToday = dateKey(day) === currentKey;
      const pct = Math.round(p.illumination * 100);
      days.push({
        dayNum: d,
        dateKey: dateKey(day),
        p,
        isToday,
        pct,
      });
    }

    return { offset, days };
  }, [calendarMonth, now]);

  return (
    <section className="zw-sky-section" aria-label="Zwosmos Skywatching - Moon Phases">
      <div className="zw-sky-page">
        <section className="zw-sky-module" aria-labelledby="sky-module-title">
          <header className="zw-sky-head">
            <div>
              <p className="zw-sky-eyebrow">Zwosmos · Skywatching</p>
              <h2 id="sky-module-title">Moon phases</h2>
              <p className="zw-sky-range">{stripData.rangeLabel}</p>
            </div>
            <div className="zw-sky-switch-wrap">
              <span className="zw-sky-switch-caption" id="hemi-label">
                Hemisphere
              </span>
              <div className="zw-sky-switch" role="group" aria-labelledby="hemi-label">
                <button
                  type="button"
                  id="north"
                  aria-label="Northern Hemisphere"
                  aria-pressed={hemisphere === 'north'}
                  onClick={() => handleHemisphere('north')}
                >
                  North
                </button>
                <button
                  type="button"
                  id="south"
                  aria-label="Southern Hemisphere"
                  aria-pressed={hemisphere === 'south'}
                  onClick={() => handleHemisphere('south')}
                >
                  South
                </button>
              </div>
            </div>
          </header>

          <div className="zw-sky-content">
            <div className="zw-sky-today-feature" aria-live="polite">
              <MoonSvg
                illumination={todayData.phase.illumination}
                waxing={todayData.phase.waxing}
                hemisphere={hemisphere}
                className="zw-sky-moon"
                idPrefix="today"
              />
              <div className="zw-sky-today-copy">
                <h3>{todayData.phase.name}</h3>
                <div className="zw-sky-today-date">
                  <strong>Today</strong> · {todayData.fullDateLabel}
                </div>
                <dl className="zw-sky-facts">
                  <div>
                    <dt>Illumination</dt>
                    <dd>{todayData.illuminationPct}%</dd>
                  </div>
                  <div>
                    <dt>Age</dt>
                    <dd>{todayData.age} d</dd>
                  </div>
                  <div>
                    <dt>Next full</dt>
                    <dd>{todayData.nextFull}</dd>
                  </div>
                  <div>
                    <dt>Next new</dt>
                    <dd>{todayData.nextNew}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="zw-sky-timeline">
              <div className="zw-sky-days" aria-label="Seven-day lunar phase forecast">
                {stripData.days.map((item, idx) => (
                  <article
                    key={idx}
                    className={`zw-sky-day${item.isToday ? ' zw-sky-today' : ''}`}
                    aria-label={`${item.week}, ${item.month} ${item.dayNum}: ${item.p.name}, ${item.pct}% illuminated${
                      item.isToday ? ', today' : ''
                    }`}
                  >
                    <div className="zw-sky-date-top">
                      <span>{item.week}</span> <span>{item.month}</span>
                    </div>
                    <div className="zw-sky-date-num">{item.dayNum}</div>
                    <div className="zw-sky-moon-wrap">
                      <MoonSvg
                        illumination={item.p.illumination}
                        waxing={item.p.waxing}
                        hemisphere={hemisphere}
                        idPrefix={`strip-${idx}`}
                      />
                    </div>
                    <div className="zw-sky-phase-name">
                      <span className="zw-sky-phase-full">{item.p.name}</span>
                      <span className="zw-sky-phase-short" aria-hidden="true">
                        {item.short}
                      </span>
                    </div>
                    <div className="zw-sky-percent">{item.pct}% lit</div>
                    {item.isToday && <div className="zw-sky-today-tag" aria-hidden="true">Today</div>}
                  </article>
                ))}
              </div>
            </div>
          </div>

          <footer className="zw-sky-foot">
            <span className="zw-sky-local-note">Local dates · Phase at noon</span>
            <button
              type="button"
              className="zw-sky-calendar-trigger"
              onClick={() => {
                setCalendarMonth(new Date());
                setIsCalendarOpen(true);
              }}
            >
              Lunar calendar <span aria-hidden="true">↗</span>
            </button>
          </footer>
        </section>
      </div>

      {/* Monthly Lunar Calendar Modal */}
      {isCalendarOpen && typeof document !== 'undefined' && createPortal(
        <div className="zw-sky-dialog-backdrop" onClick={() => setIsCalendarOpen(false)}>
          <div
            className="zw-sky-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cal-title"
          >
            <header className="zw-sky-cal-head">
              <h2 id="cal-title">
                {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calendarMonth)}
              </h2>
              <div className="zw-sky-cal-controls">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() =>
                    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                  }
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                  }
                >
                  →
                </button>
                <button
                  className="zw-sky-close"
                  type="button"
                  aria-label="Close calendar"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  ×
                </button>
              </div>
            </header>
            <div className="zw-sky-calendar-body">
              <div className="zw-sky-weekdays" aria-hidden="true">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              <div className="zw-sky-month-grid">
                {Array.from({ length: calendarData.offset }).map((_, i) => (
                  <div key={`empty-${i}`} className="zw-sky-cal-cell empty" aria-hidden="true" />
                ))}
                {calendarData.days.map((item) => (
                  <div
                    key={item.dayNum}
                    className={`zw-sky-cal-cell${item.isToday ? ' current' : ''}`}
                    aria-label={`${item.dateKey}: ${item.p.name}, ${item.pct}% illuminated`}
                  >
                    <div className="cal-date">
                      {item.dayNum}
                      {item.isToday ? ' · Today' : ''}
                    </div>
                    <MoonSvg
                      illumination={item.p.illumination}
                      waxing={item.p.waxing}
                      hemisphere={hemisphere}
                      className="cal-moon"
                      idPrefix={`cal-${item.dayNum}`}
                    />
                    <div className="cal-label">{item.p.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};
export default SkywatchingSection;
