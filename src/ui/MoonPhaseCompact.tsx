/**
 * MoonPhaseCompact.tsx
 * Compact sidebar variant — ported 1-to-1 from "Zwosmos_Moon_Phase_Strip (1).html"
 * Same lunar math as MoonPhaseStrip, smaller moons, tighter padding.
 * Designed to sit alongside "This Day in Astronomy" on the homepage.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import './MoonPhaseCompact.css';

// ---------- CSS fallback for inline SSR/render guarantee ----------
const COMPACT_CSS = `
  .zwc-wrap *{box-sizing:border-box;}
  .zwc-wrap{font-family:"Lora",Georgia,"Times New Roman",serif;color:#f2f2ec;width:100%;}
  .zwc-wrap button{font:inherit;cursor:pointer;}
  .zwc-wrap button:focus-visible{outline:2px solid #f8db9b;outline-offset:3px;}
  .zwc-module{background:linear-gradient(135deg,#142238 0%,#101b2d 44%,#0d182a 100%);border:1px solid #33425b;border-radius:12px;overflow:hidden;}
  .zwc-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 18px 9px;}
  .zwc-head h2{margin:0;font-family:"Playfair Display",Georgia,serif;font-size:1.26rem;font-weight:400;letter-spacing:-.02em;color:#f2f2ec;}
  .zwc-eyebrow{color:#e8c88e;text-transform:uppercase;letter-spacing:.13em;font:600 .58rem/1.2 system-ui,sans-serif;margin:0 0 4px;}
  .zwc-range{margin:3px 0 0;color:#a6b3c7;font:500 .69rem/1.3 system-ui,sans-serif;}
  .zwc-switch-wrap{display:flex;align-items:center;gap:9px;flex-shrink:0;}
  .zwc-switch-caption{color:#a6b3c7;font:600 .6rem/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.09em;}
  .zwc-switch{display:flex;padding:2px;background:#0b1526;border:1px solid #46546c;border-radius:99px;}
  .zwc-switch button{background:none;color:#bbc7d8;border:0;border-radius:99px;padding:5px 10px;font:600 .65rem/1 system-ui,sans-serif;min-height:27px;}
  .zwc-switch button[aria-pressed=true]{color:#161d2b;background:#e8c88e;}
  .zwc-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));padding:0 12px 7px;}
  .zwc-day{position:relative;text-align:center;min-width:0;padding:6px 3px 7px;border-left:1px solid #344158;}
  .zwc-day:first-child{border-left:0;}
  .zwc-day.zwc-today{background:linear-gradient(#36445777,#17263b33);border:1px solid #8290a288;border-radius:8px;margin:-1px 0;}
  .zwc-day.zwc-today + .zwc-day{border-left-color:transparent;}
  .zwc-date-top{font:600 .58rem/1.2 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#b6c3d5;}
  .zwc-date-top span{display:inline;}
  .zwc-date-num{font:400 1.1rem/1.1 Georgia,serif;color:#f2f0e8;margin-top:2px;}
  .zwc-moon-wrap{display:grid;place-items:center;height:48px;margin:1px auto;}
  .zwc-moon{width:40px;height:40px;display:block;filter:drop-shadow(0 0 8px #dec5a126);}
  .zwc-phase-name{font-size:.73rem;line-height:1.15;min-height:1.15em;}
  .zwc-phase-short{display:none;}
  .zwc-percent{margin-top:3px;font:500 .61rem/1.2 system-ui,sans-serif;color:#b9c6d7;}
  .zwc-today-dot{position:absolute;top:5px;right:5px;width:4px;height:4px;border-radius:50%;background:#e8c88e;}
  .zwc-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #344058;padding:7px 18px;}
  .zwc-wrap.zwc-fill{display:flex;flex-direction:column;height:100%;}
  .zwc-wrap.zwc-fill .zwc-module{flex:1;display:flex;flex-direction:column;}
  .zwc-wrap.zwc-fill .zwc-days{flex:1;align-content:center;}
  .zwc-local-note{color:#a6b3c7;font:400 .61rem/1.3 system-ui,sans-serif;}
  .zwc-cal-trigger{flex-shrink:0;border:0;background:none;color:#e8c88e;padding:3px 0;font:700 .66rem/1.2 system-ui,sans-serif;letter-spacing:.015em;}
  .zwc-cal-trigger:hover{text-decoration:underline;}
  dialog.zwc-cal-dialog{border:1px solid #52617b;background:#0f1b2e;color:#f2f2ec;border-radius:18px;width:min(950px,calc(100% - 20px));max-height:90dvh;padding:0;box-shadow:0 35px 100px #000b;}
  dialog.zwc-cal-dialog::backdrop{background:#020813c9;backdrop-filter:blur(6px);}
  .zwc-cal-head{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #344058;padding:22px clamp(18px,3vw,32px);}
  .zwc-cal-head h2{margin:0;font-size:clamp(1.4rem,2.5vw,2.1rem);font-weight:400;font-family:"Playfair Display",Georgia,serif;}
  .zwc-cal-controls{display:flex;align-items:center;gap:6px;}
  .zwc-cal-controls button{border:1px solid #42516c;background:#1d2d45;border-radius:8px;color:#fff;min-width:36px;height:36px;}
  .zwc-cal-controls button:hover{background:#33445c;}
  .zwc-cal-body{padding:18px clamp(10px,2vw,30px) 30px;overflow:auto;max-height:calc(90dvh - 90px);}
  .zwc-weekdays,.zwc-month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));}
  .zwc-weekdays div{color:#aebbd0;text-align:center;font:700 .65rem/1 system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;padding:6px 0 12px;}
  .zwc-cal-cell{min-height:109px;border:1px solid #334159;padding:9px 6px;text-align:center;}
  .zwc-cal-cell.zwc-empty{background:#0a1524;}
  .zwc-cal-cell.zwc-current{border-color:#e8c88e;background:#233248;}
  .zwc-cal-cell .zwc-cal-date{color:#e0e9f4;font:.7rem/1.1 system-ui,sans-serif;text-align:left;padding-left:6px;}
  .zwc-cal-cell .zwc-cal-moon{width:43px;height:43px;margin:2px auto;}
  .zwc-cal-cell .zwc-cal-label{color:#c6d2e1;font:.58rem/1.15 system-ui,sans-serif;}
  @media(max-width:760px){
    .zwc-head{padding:9px 10px 7px;}
    .zwc-head h2{font-size:1rem;}
    .zwc-eyebrow{font-size:.49rem;}
    .zwc-range{font-size:.53rem;max-width:145px;}
    .zwc-switch-wrap{gap:4px;}
    .zwc-switch-caption{font-size:.49rem;}
    .zwc-switch button{padding:5px 6px;font-size:.56rem;min-height:27px;}
    .zwc-days{padding:0 5px 5px;}
    .zwc-day{padding:5px 1px 6px;}
    .zwc-date-top{font-size:.5rem;letter-spacing:0;}
    .zwc-date-top span{display:block;}
    .zwc-date-num{font-size:.86rem;}
    .zwc-moon-wrap{height:33px;}
    .zwc-moon{width:29px;height:29px;}
    .zwc-phase-name{font-size:.5rem;min-height:2.25em;display:grid;place-items:center;}
    .zwc-phase-full{display:none;}
    .zwc-phase-short{display:inline;}
    .zwc-percent{font-size:.48rem;margin-top:1px;}
    .zwc-foot{padding:6px 10px;}
    .zwc-local-note{font-size:.52rem;}
    .zwc-cal-trigger{font-size:.55rem;}
    .zwc-cal-cell{min-height:80px;padding:6px 0;}
    .zwc-cal-cell .zwc-cal-moon{width:30px;height:30px;}
    .zwc-cal-cell .zwc-cal-label{font-size:.45rem;}
  }
  @media(max-width:360px){.zwc-switch-caption{display:none;}.zwc-head{gap:4px;}}
  @media(prefers-reduced-motion:no-preference){.zwc-moon{transition:transform .3s ease;}.zwc-day:hover .zwc-moon{transform:scale(1.08);}}
`;

// ---------- Phase abbreviations (from compact HTML) ----------
const SHORT: Record<string, string> = {
  'New Moon': 'New',
  'Waxing Crescent': 'Wax Cres',
  'First Quarter': '1st Qtr',
  'Waxing Gibbous': 'Wax Gib',
  'Full Moon': 'Full',
  'Waning Gibbous': 'Wan Gib',
  'Last Quarter': 'Last Qtr',
  'Waning Crescent': 'Wan Cres'
};

// ---------- Shared lunar math (same as MoonPhaseStrip) ----------
const RAD = Math.PI / 180;
const norm = (n: number) => ((n % 360) + 360) % 360;
const sinD = (n: number) => Math.sin(n * RAD);
const cosD = (n: number) => Math.cos(n * RAD);
const localNoon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
const dateKey = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

function lunarAngle(moment: Date): number {
  const d = (moment.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
  const solarMean = norm(357.5291 + 0.98560028 * d);
  const sunCenter = 1.9148 * sinD(solarMean) + 0.02 * sinD(2 * solarMean);
  const sun = norm(280.46646 + 0.98564736 * d + sunCenter);
  const lunarMean = norm(134.9634 + 13.06499295 * d);
  const elong = norm(297.8501921 + 12.19074912 * d);
  const latArg = norm(93.272095 + 13.22935026 * d);
  const moon = norm(218.3164477 + 13.17639648 * d + 6.289 * sinD(lunarMean) + 1.274 * sinD(2 * elong - lunarMean) + 0.658 * sinD(2 * elong) + 0.214 * sinD(2 * lunarMean) - 0.186 * sinD(solarMean) - 0.114 * sinD(2 * latArg));
  return norm(moon - sun);
}

interface Phase {
  name: string;
  illumination: number;
  waxing: boolean;
}

function phaseAt(date: Date): Phase {
  const angle = lunarAngle(localNoon(date));
  const illumination = (1 - cosD(angle)) / 2;
  const start = lunarAngle(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  const end = lunarAngle(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
  const sweep = norm(end - start);
  const major: [number, string][] = [[0, 'New Moon'], [90, 'First Quarter'], [180, 'Full Moon'], [270, 'Last Quarter']];
  const hit = major.find(([target]) => norm(target - start) < sweep);
  const name = hit?.[1] || (angle < 90 ? 'Waxing Crescent' : angle < 180 ? 'Waxing Gibbous' : angle < 270 ? 'Waning Gibbous' : 'Waning Crescent');
  return { name, illumination, waxing: angle < 180 };
}

function buildMoon(phase: Phase, hemisphere: 'north' | 'south', cls = 'zwc-moon'): string {
  const isCal = cls.includes('cal');
  const size = isCal ? 43 : 40;
  const r = 35, cx = 40, cy = 40;
  const rightSide = phase.waxing === (hemisphere === 'north');
  const k = Math.max(0, Math.min(1, phase.illumination));
  const uid = Math.random().toString(36).slice(2, 8);
  const lit: string[] = [];
  for (let y = -r; y <= r; y++) {
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    lit.push(`${lit.length ? 'L' : 'M'}${(cx + (rightSide ? 1 - 2 * k : 2 * k - 1) * half).toFixed(2)} ${(cy + y).toFixed(2)}`);
  }
  for (let y = r; y >= -r; y--) {
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    lit.push(`L${(cx + (rightSide ? half : -half)).toFixed(2)} ${(cy + y).toFixed(2)}`);
  }
  const path = lit.join(' ') + ' Z';
  return `<svg class="${cls}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;max-width:100%;max-height:100%;display:block;margin:0 auto;filter:drop-shadow(0 0 8px #dec5a126);" viewBox="0 0 80 80" aria-hidden="true" focusable="false"><defs><radialGradient id="cd${uid}"><stop stop-color="#36475a"/><stop offset="1" stop-color="#17283b"/></radialGradient><radialGradient id="cl${uid}"><stop stop-color="#f9f5e9"/><stop offset=".74" stop-color="#e6e4d9"/><stop offset="1" stop-color="#aaafae"/></radialGradient><clipPath id="cf${uid}"><circle cx="40" cy="40" r="35"/></clipPath></defs><circle cx="40" cy="40" r="35" fill="url(#cd${uid})" stroke="#8493a0" stroke-opacity=".38"/><path d="${path}" fill="url(#cl${uid})"/><g clip-path="url(#cf${uid})" fill="#7d8580" opacity=".13"><circle cx="28" cy="28" r="5"/><circle cx="50" cy="48" r="7"/><circle cx="46" cy="23" r="3"/><circle cx="24" cy="51" r="4"/></g></svg>`;
}

// ---------- Component ----------
export default function MoonPhaseCompact({ fillHeight = false }: { fillHeight?: boolean }) {
  const [hemisphere, setHemisphere] = useState<'north' | 'south'>(() => {
    try { return localStorage.getItem('zwosmos-hemisphere') === 'south' ? 'south' : 'north'; } catch { return 'north'; }
  });
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [tick, setTick] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Midnight re-render
  useEffect(() => {
    const iv = setInterval(() => setTick(n => n + 1), 60000);
    const onVis = () => { if (!document.hidden) setTick(n => n + 1); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Dialog open/close modal handling
  useEffect(() => {
    if (calOpen && dialogRef.current) {
      try {
        if (!dialogRef.current.open) {
          dialogRef.current.showModal();
        }
      } catch (e) {
        console.warn('Dialog modal error:', e);
      }
    }
  }, [calOpen]);

  const switchHemi = useCallback((h: 'north' | 'south') => {
    setHemisphere(h);
    try { localStorage.setItem('zwosmos-hemisphere', h); } catch {}
  }, []);

  // Build strip
  const today = new Date();
  const locale = navigator.language || 'en-US';
  const end7 = addDays(today, 6);
  const startLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(today);
  const endLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(end7);
  const rangeText = `${startLabel} – ${endLabel}`;

  const stripHTML = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    const p = phaseAt(day);
    const isToday = i === 0;
    const week = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day);
    const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(day);
    const pct = Math.round(p.illumination * 100);
    const short = SHORT[p.name] || p.name;
    return (
      `<article class="zwc-day${isToday ? ' zwc-today' : ''}" aria-label="${week}, ${month} ${day.getDate()}: ${p.name}, ${pct}% illuminated${isToday ? ', today' : ''}">` +
      `<div class="zwc-date-top"><span>${week}</span> <span>${month}</span></div>` +
      `<div class="zwc-date-num">${day.getDate()}</div>` +
      `<div class="zwc-moon-wrap" style="display:grid;place-items:center;height:48px;width:100%;overflow:hidden;margin:1px auto;">${buildMoon(p, hemisphere)}</div>` +
      `<div class="zwc-phase-name"><span class="zwc-phase-full">${p.name}</span><span class="zwc-phase-short" aria-hidden="true">${short}</span></div>` +
      `<div class="zwc-percent">${pct}% lit</div>` +
      (isToday ? '<div class="zwc-today-dot" aria-hidden="true"></div>' : '') +
      `</article>`
    );
  }).join('');

  // Build calendar only when open
  const cy = calMonth.getFullYear(), cm = calMonth.getMonth();
  const calTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calMonth);
  const todayKey = dateKey(today);
  const offset = new Date(cy, cm, 1).getDay();
  const daysInMonth = new Date(cy, cm + 1, 0).getDate();
  const calCells = calOpen ? [
    ...Array.from({ length: offset }, () => '<div class="zwc-cal-cell zwc-empty" aria-hidden="true"></div>'),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const n = i + 1;
      const d = new Date(cy, cm, n, 12);
      const p = phaseAt(d);
      const isTd = dateKey(d) === todayKey;
      const pct = Math.round(p.illumination * 100);
      return (
        `<div class="zwc-cal-cell${isTd ? ' zwc-current' : ''}" aria-label="${dateKey(d)}: ${p.name}, ${pct}% illuminated">` +
        `<div class="zwc-cal-date">${n}${isTd ? ' · Today' : ''}</div>` +
        buildMoon(p, hemisphere, 'zwc-cal-moon') +
        `<div class="zwc-cal-label">${p.name}</div>` +
        `</div>`
      );
    })
  ].join('') : '';

  void tick;

  return (
    <div
      className={`zwc-wrap${fillHeight ? ' zwc-fill' : ''}`}
      style={{ width: '100%', overflow: 'hidden' }}
    >
      <style dangerouslySetInnerHTML={{ __html: COMPACT_CSS }} />
      <section className="zwc-module" aria-labelledby="zwc-strip-title" style={{ overflow: 'hidden' }}>
        <header className="zwc-head">
          <div>
            <p className="zwc-eyebrow">Zwosmos · Skywatching</p>
            <h2 id="zwc-strip-title">Moon phases</h2>
            <p className="zwc-range">{rangeText}</p>
          </div>
          <div className="zwc-switch-wrap">
            <span className="zwc-switch-caption" id="zwc-hemi-label">Hemisphere</span>
            <div className="zwc-switch" role="group" aria-labelledby="zwc-hemi-label">
              <button type="button" aria-label="Northern Hemisphere" aria-pressed={hemisphere === 'north'} onClick={() => switchHemi('north')}>North</button>
              <button type="button" aria-label="Southern Hemisphere" aria-pressed={hemisphere === 'south'} onClick={() => switchHemi('south')}>South</button>
            </div>
          </div>
        </header>

        <div
          className="zwc-days"
          aria-label="Seven-day lunar phase forecast"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            padding: '0 12px 7px'
          }}
          dangerouslySetInnerHTML={{ __html: stripHTML }}
        />

        <footer className="zwc-foot">
          <span className="zwc-local-note">Local dates · Phase at noon</span>
          <button type="button" className="zwc-cal-trigger" onClick={() => { setCalMonth(new Date()); setCalOpen(true); }}>
            Lunar calendar <span aria-hidden="true">↗</span>
          </button>
        </footer>
      </section>

      {/* Full-month calendar dialog — only mounted when active */}
      {calOpen && (
        <dialog
          ref={dialogRef}
          className="zwc-cal-dialog"
          aria-labelledby="zwc-cal-title"
          onClose={() => setCalOpen(false)}
        >
          <header className="zwc-cal-head">
            <h2 id="zwc-cal-title">{calTitle}</h2>
            <div className="zwc-cal-controls">
              <button type="button" aria-label="Previous month" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>←</button>
              <button type="button" aria-label="Next month" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>→</button>
              <button type="button" aria-label="Close calendar" style={{ marginLeft: '9px' }} onClick={() => setCalOpen(false)}>×</button>
            </div>
          </header>
          <div className="zwc-cal-body">
            <div className="zwc-weekdays" aria-hidden="true">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="zwc-month-grid" dangerouslySetInnerHTML={{ __html: calCells }} />
          </div>
        </dialog>
      )}
    </div>
  );
}
