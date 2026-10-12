/**
 * MoonPhaseStrip.tsx
 * Ported 1-to-1 from Zwosmos_Moon_Phase_Strip.html.
 * Exact same colors, CSS variables, lunar math, SVG moon drawing,
 * hemisphere toggle (localStorage persisted) and full-month dialog calendar.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import './MoonPhaseStrip.css';

// ---------- CSS fallback for inline SSR/render guarantee ----------
const STRIP_CSS = `
  .zw-moon-strip *{box-sizing:border-box;}
  .zw-moon-strip{--bg:#080e1b;--surface:#101b2d;--surface2:#152238;--line:#344058;--text:#f2f2ec;--muted:#a6b3c7;--accent:#ffba00;--focus:#f8db9b;font-family:"Lora",Georgia,"Times New Roman",serif;color:var(--text);width:100%;}
  .zw-moon-strip button{font:inherit;cursor:pointer;}
  .zw-moon-strip button:focus-visible{outline:2px solid var(--focus);outline-offset:3px;}
  .zw-moon-module{background:linear-gradient(135deg,#142238 0%,#101b2d 44%,#0d182a 100%);border:1px solid #33425b;border-radius:18px;box-shadow:0 25px 80px #0005;overflow:hidden;margin-bottom:30px;}
  .zw-module-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:clamp(24px,3vw,40px) clamp(22px,3vw,44px) 27px;}
  .zw-module-head h2{margin:0;font-family:"Playfair Display",Georgia,serif;font-size:clamp(1.55rem,2.6vw,2.65rem);font-weight:400;letter-spacing:-.03em;color:#f2f2ec;}
  .zw-eyebrow{color:#ffba00;text-transform:uppercase;letter-spacing:.22em;font:600 .68rem/1.5 system-ui,sans-serif;margin:0 0 10px;}
  .zw-range{margin:9px 0 0;color:#a6b3c7;font:500 .83rem/1.4 system-ui,sans-serif;}
  .zw-switch-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;}
  .zw-switch-caption{color:#a6b3c7;font:600 .65rem/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.15em;}
  .zw-switch{display:flex;padding:3px;background:#0b1526;border:1px solid #46546c;border-radius:99px;}
  .zw-switch button{background:none;color:#bbc7d8;border:0;border-radius:99px;padding:9px 16px;font:600 .76rem/1 system-ui,sans-serif;min-height:36px;}
  .zw-switch button[aria-pressed=true]{color:#161d2b;background:#ffba00;}
  .zw-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));padding:0 clamp(9px,1.7vw,24px) 25px;}
  .zw-day{position:relative;text-align:center;min-width:0;padding:18px 6px 23px;border-left:1px solid #344158;}
  .zw-day:first-child{border-left:0;}
  .zw-day.zw-today{background:linear-gradient(#36445777,#17263b33);border:1px solid #8290a288;border-radius:12px;margin:-1px 0;}
  .zw-day.zw-today + .zw-day{border-left-color:transparent;}
  .zw-date-top{font:700 .69rem/1.4 system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#b6c3d5;}
  .zw-date-top span{display:block;}
  .zw-date-num{font:400 clamp(1.4rem,2vw,2rem)/1.1 Georgia,serif;color:#f2f0e8;margin-top:5px;}
  .zw-moon-wrap{display:grid;place-items:center;height:113px;margin:6px auto 10px;}
  .zw-moon{width:76px;height:76px;display:block;filter:drop-shadow(0 0 15px #dec5a126);}
  .zw-phase-name{font-size:clamp(.83rem,1vw,1rem);line-height:1.25;min-height:2.5em;display:grid;place-items:center;padding:0 4px;}
  .zw-percent{margin-top:4px;font:500 .74rem/1.2 system-ui,sans-serif;color:#b9c6d7;}
  .zw-today-tag{position:absolute;bottom:5px;left:0;right:0;font:700 .57rem/1.2 system-ui,sans-serif;letter-spacing:.18em;color:#ffba00;text-transform:uppercase;}
  .zw-module-foot{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid #344058;padding:21px clamp(22px,3vw,44px) 23px;}
  .zw-local-note{color:#a6b3c7;font:400 .75rem/1.45 system-ui,sans-serif;}
  .zw-cal-trigger{flex-shrink:0;border:0;background:none;color:#ffba00;padding:6px 0;font:700 .78rem/1.2 system-ui,sans-serif;letter-spacing:.015em;}
  .zw-cal-trigger:hover{text-decoration:underline;}
  dialog.zw-cal-dialog{border:1px solid #52617b;background:#0f1b2e;color:#f2f2ec;border-radius:18px;width:min(950px,calc(100% - 20px));max-height:90dvh;padding:0;box-shadow:0 35px 100px #000b;}
  dialog.zw-cal-dialog::backdrop{background:#020813c9;backdrop-filter:blur(6px);}
  .zw-cal-head{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #344058;padding:22px clamp(18px,3vw,32px);}
  .zw-cal-head h2{margin:0;font-size:clamp(1.4rem,2.5vw,2.1rem);font-weight:400;font-family:"Playfair Display",Georgia,serif;}
  .zw-cal-controls{display:flex;align-items:center;gap:6px;}
  .zw-cal-controls button{border:1px solid #42516c;background:#1d2d45;border-radius:8px;color:#fff;min-width:36px;height:36px;}
  .zw-cal-controls button:hover{background:#33445c;}
  .zw-cal-body{padding:18px clamp(10px,2vw,30px) 30px;overflow:auto;max-height:calc(90dvh - 90px);}
  .zw-weekdays,.zw-month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));}
  .zw-weekdays div{color:#aebbd0;text-align:center;font:700 .65rem/1 system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;padding:6px 0 12px;}
  .zw-cal-cell{min-height:109px;border:1px solid #334159;padding:9px 6px;text-align:center;}
  .zw-cal-cell.zw-empty{background:#0a1524;}
  .zw-cal-cell.zw-current{border-color:#ffba00;background:#233248;}
  .zw-cal-cell .zw-cal-date{color:#e0e9f4;font:.7rem/1.1 system-ui,sans-serif;text-align:left;padding-left:6px;}
  .zw-cal-cell .zw-cal-moon{width:43px;height:43px;margin:2px auto;}
  .zw-cal-cell .zw-cal-label{color:#c6d2e1;font:.58rem/1.15 system-ui,sans-serif;}
  @media(max-width:760px){
    .zw-module-head{align-items:flex-start;flex-wrap:wrap;padding-bottom:20px;}
    .zw-switch-wrap{align-items:flex-start;}
    .zw-days{display:flex;flex-direction:column;padding:0 14px 18px;}
    .zw-day,.zw-day:first-child{display:grid;grid-template-columns:63px 71px minmax(0,1fr) auto;grid-template-rows:1fr 1fr;column-gap:11px;min-height:95px;align-items:center;text-align:left;border-left:0;border-top:1px solid #344158;padding:10px 10px;}
    .zw-day.zw-today{border:1px solid #8290a288;margin:0;}
    .zw-day.zw-today + .zw-day{border-top-color:transparent;}
    .zw-date-top{grid-column:1;grid-row:1;font-size:.62rem;align-self:end;}
    .zw-date-top span{display:inline;}
    .zw-date-num{grid-column:1;grid-row:2;margin:1px 0 0;align-self:start;font-size:1.45rem;}
    .zw-moon-wrap{grid-column:2;grid-row:1/3;height:auto;margin:0;}
    .zw-moon{width:58px;height:58px;}
    .zw-phase-name{grid-column:3;grid-row:1/3;display:block;min-height:0;padding:0;font-size:.98rem;}
    .zw-percent{grid-column:4;grid-row:1/3;margin:0;white-space:nowrap;}
    .zw-today-tag{position:static;grid-column:3;grid-row:2;align-self:end;font-size:.53rem;}
    .zw-day.zw-today .zw-phase-name{grid-row:1;align-self:end;}
    .zw-module-foot{align-items:flex-start;flex-direction:column;gap:7px;}
    .zw-cal-cell{min-height:80px;padding:6px 0;}
    .zw-cal-cell .zw-cal-moon{width:30px;height:30px;}
    .zw-cal-cell .zw-cal-label{font-size:.45rem;}
  }
  @media(max-width:390px){
    .zw-day,.zw-day:first-child{grid-template-columns:53px 54px minmax(0,1fr) auto;gap:6px;}
    .zw-moon{width:49px;height:49px;}
    .zw-phase-name{font-size:.87rem;}
    .zw-percent{font-size:.68rem;}
  }
  @media(prefers-reduced-motion:no-preference){
    .zw-moon{transition:transform .3s ease;}
    .zw-day:hover .zw-moon{transform:scale(1.08);}
  }
`;

// ---------- Lunar math (same as original HTML, translated to TypeScript) ----------
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
  const moon = norm(
    218.3164477 + 13.17639648 * d +
    6.289 * sinD(lunarMean) +
    1.274 * sinD(2 * elong - lunarMean) +
    0.658 * sinD(2 * elong) +
    0.214 * sinD(2 * lunarMean) -
    0.186 * sinD(solarMean) -
    0.114 * sinD(2 * latArg)
  );
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

function buildMoonSVG(phase: Phase, hemisphere: 'north' | 'south', cls = 'zw-moon'): string {
  const isCal = cls.includes('cal');
  const size = isCal ? 43 : 76;
  const r = 35, cx = 40, cy = 40;
  const rightSide = phase.waxing === (hemisphere === 'north');
  const k = Math.max(0, Math.min(1, phase.illumination));
  const uid = Math.random().toString(36).slice(2, 8);
  const lit: string[] = [];
  for (let y = -r; y <= r; y += 1) {
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    lit.push(`${lit.length ? 'L' : 'M'}${(cx + (rightSide ? 1 - 2 * k : 2 * k - 1) * half).toFixed(2)} ${(cy + y).toFixed(2)}`);
  }
  for (let y = r; y >= -r; y -= 1) {
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    lit.push(`L${(cx + (rightSide ? half : -half)).toFixed(2)} ${(cy + y).toFixed(2)}`);
  }
  const path = lit.join(' ') + ' Z';
  return `<svg class="${cls}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;max-width:100%;max-height:100%;display:block;margin:0 auto;filter:drop-shadow(0 0 15px #dec5a126);" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="d${uid}"><stop stop-color="#36475a"/><stop offset="1" stop-color="#17283b"/></radialGradient>
      <radialGradient id="l${uid}"><stop stop-color="#f9f5e9"/><stop offset=".74" stop-color="#e6e4d9"/><stop offset="1" stop-color="#aaafae"/></radialGradient>
      <clipPath id="f${uid}"><circle cx="40" cy="40" r="35"/></clipPath>
    </defs>
    <circle cx="40" cy="40" r="35" fill="url(#d${uid})" stroke="#8493a0" stroke-opacity=".38"/>
    <path d="${path}" fill="url(#l${uid})"/>
    <g clip-path="url(#f${uid})" fill="#7d8580" opacity=".13">
      <circle cx="28" cy="28" r="5"/><circle cx="50" cy="48" r="7"/>
      <circle cx="46" cy="23" r="3"/><circle cx="24" cy="51" r="4"/>
    </g>
  </svg>`;
}

// ---------- Component ----------
export default function MoonPhaseStrip() {
  const [hemisphere, setHemisphere] = useState<'north' | 'south'>(() => {
    try { return localStorage.getItem('zwosmos-hemisphere') === 'south' ? 'south' : 'north'; } catch { return 'north'; }
  });
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [tick, setTick] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Midnight re-render + visibility change
  useEffect(() => {
    const iv = setInterval(() => setTick(n => n + 1), 60000);
    const onVis = () => { if (!document.hidden) setTick(n => n + 1); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Dialog control
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
    try { localStorage.setItem('zwosmos-hemisphere', h); } catch { }
  }, []);

  // ---- Build 7-day strip ----
  const today = new Date();
  const locale = navigator.language || 'en-US';
  const end7 = addDays(today, 6);
  const rangeText = `${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(today)} – ${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(end7)} · Your local dates`;

  const stripDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    const p = phaseAt(day);
    const isToday = i === 0;
    const week = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day);
    const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(day);
    const pct = Math.round(p.illumination * 100);
    return (
      `<article class="zw-day${isToday ? ' zw-today' : ''}" aria-label="${week}, ${month} ${day.getDate()}: ${p.name}, ${pct}% illuminated${isToday ? ', today' : ''}">` +
      `<div class="zw-date-top"><span>${week}</span> <span>${month}</span></div>` +
      `<div class="zw-date-num">${day.getDate()}</div>` +
      `<div class="zw-moon-wrap" style="display:grid;place-items:center;height:113px;width:100%;overflow:hidden;margin:6px auto 10px;">${buildMoonSVG(p, hemisphere)}</div>` +
      `<div class="zw-phase-name">${p.name}</div>` +
      `<div class="zw-percent">${pct}% lit</div>` +
      (isToday ? '<div class="zw-today-tag">Today</div>' : '') +
      `</article>`
    );
  }).join('');

  // ---- Build calendar only when active ----
  const cy = calMonth.getFullYear(), cm = calMonth.getMonth();
  const calTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calMonth);
  const todayKey = dateKey(today);
  const offset = new Date(cy, cm, 1).getDay();
  const daysInMonth = new Date(cy, cm + 1, 0).getDate();
  const calCells = calOpen ? [
    ...Array.from({ length: offset }, () => '<div class="zw-cal-cell zw-empty" aria-hidden="true"></div>'),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const n = i + 1;
      const d = new Date(cy, cm, n, 12);
      const p = phaseAt(d);
      const isTd = dateKey(d) === todayKey;
      const pct = Math.round(p.illumination * 100);
      return (
        `<div class="zw-cal-cell${isTd ? ' zw-current' : ''}" aria-label="${dateKey(d)}: ${p.name}, ${pct}% illuminated">` +
        `<div class="zw-cal-date">${n}${isTd ? ' · Today' : ''}</div>` +
        buildMoonSVG(p, hemisphere, 'zw-cal-moon') +
        `<div class="zw-cal-label">${p.name}</div>` +
        `</div>`
      );
    })
  ].join('') : '';

  // tick reference keeps midnight re-render active
  void tick;

  return (
    <div className="zw-moon-strip" style={{ width: '100%', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: STRIP_CSS }} />
      {/* ── 7-DAY STRIP MODULE ── */}
      <section className="zw-moon-module" aria-labelledby="zw-strip-title" style={{ overflow: 'hidden' }}>
        <header className="zw-module-head">
          <div>
            <p className="zw-eyebrow">Your night sky</p>
            <h2 id="zw-strip-title">Moon phases</h2>
            <p className="zw-range">{rangeText}</p>
          </div>
          <div className="zw-switch-wrap">
            <span className="zw-switch-caption" id="zw-hemi-label">View from</span>
            <div className="zw-switch" role="group" aria-labelledby="zw-hemi-label">
              <button type="button" aria-pressed={hemisphere === 'north'} onClick={() => switchHemi('north')}>Northern</button>
              <button type="button" aria-pressed={hemisphere === 'south'} onClick={() => switchHemi('south')}>Southern</button>
            </div>
          </div>
        </header>

        <div
          className="zw-days"
          aria-label="Seven-day lunar phase forecast"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))'
          }}
          dangerouslySetInnerHTML={{ __html: stripDays }}
        />

        <footer className="zw-module-foot">
          <span className="zw-local-note">Daily phases at local noon · Dates shown in your time zone</span>
          <button
            type="button"
            className="zw-cal-trigger"
            onClick={() => { setCalMonth(new Date()); setCalOpen(true); }}
          >
            Explore lunar calendar <span aria-hidden="true">↗</span>
          </button>
        </footer>
      </section>

      {/* ── FULL-MONTH CALENDAR DIALOG ── */}
      {calOpen && (
        <dialog
          ref={dialogRef}
          className="zw-cal-dialog"
          aria-labelledby="zw-cal-title"
          onClose={() => setCalOpen(false)}
        >
          <header className="zw-cal-head">
            <h2 id="zw-cal-title">{calTitle}</h2>
            <div className="zw-cal-controls">
              <button type="button" aria-label="Previous month"
                onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>←</button>
              <button type="button" aria-label="Next month"
                onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>→</button>
              <button type="button" aria-label="Close calendar" style={{ marginLeft: '9px' }}
                onClick={() => setCalOpen(false)}>×</button>
            </div>
          </header>
          <div className="zw-cal-body">
            <div className="zw-weekdays" aria-hidden="true">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="zw-month-grid" dangerouslySetInnerHTML={{ __html: calCells }} />
          </div>
        </dialog>
      )}
    </div>
  );
}
