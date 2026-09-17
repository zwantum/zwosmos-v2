import React, { useState, useEffect } from 'react';
import { useMobile } from '../contexts/MobileContext';

const CountdownTimer: React.FC = () => {
  const { isMobile } = useMobile();
  const [time, setTime] = useState<string>('00:00:00');

  useEffect(() => {
    // Just a dummy timer for the UI
    const interval = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = endOfDay.getTime() - now.getTime();
      
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: '#38bdf8',
      fontFamily: "'Orbitron', sans-serif",
      fontSize: isMobile ? '0.82rem' : '0.92rem',
      letterSpacing: '2.5px',
      textShadow: '0 0 10px rgba(56, 189, 248, 0.8), 0 0 20px rgba(56, 189, 248, 0.4)',
      background: 'rgba(12, 74, 110, 0.35)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      padding: isMobile ? '10px 22px' : '12px 30px',
      borderRadius: '30px',
      boxShadow: '0 0 20px rgba(56, 189, 248, 0.25), inset 0 0 12px rgba(56, 189, 248, 0.15)',
      pointerEvents: 'auto'
    }}>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? '0.72rem' : '0.8rem', letterSpacing: '2px' }}>NEXT FACT IN</span>
      <span style={{ fontWeight: 'bold' }}>{time}</span>
    </div>
  );
};

export default CountdownTimer;

