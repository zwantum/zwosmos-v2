import React, { useState, useEffect } from 'react';

const CountdownTimer: React.FC = () => {
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
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      color: '#38bdf8',
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '1rem',
      letterSpacing: '3px',
      textShadow: '0 0 10px rgba(56, 189, 248, 0.8), 0 0 20px rgba(56, 189, 248, 0.4)',
      background: 'rgba(12, 74, 110, 0.3)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      padding: '10px 20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', letterSpacing: '2px' }}>NEXT FACT IN</span>
      <span style={{ fontWeight: 'bold' }}>{time}</span>
    </div>
  );
};

export default CountdownTimer;

