import React from 'react';
import { useMobile } from '../contexts/MobileContext';

const HeroContent: React.FC = () => {
  const { isMobile } = useMobile();

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      pointerEvents: 'none',
      textAlign: 'center',
      padding: isMobile ? '0 15px' : '0 20px',
      boxSizing: 'border-box'
    }}>
      <div
      >
        <h3 style={{
          fontFamily: "'Orbitron', sans-serif",
          color: '#38bdf8',
          fontSize: isMobile ? '0.7rem' : '0.9rem',
          letterSpacing: isMobile ? '2px' : '4px',
          marginBottom: isMobile ? '15px' : '20px',
          textTransform: 'uppercase',
          textShadow: '0 0 10px rgba(56, 189, 248, 0.8)'
        }}>
          ✦ Daily Space Fact ✦
        </h3>

        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          color: 'white',
          fontSize: isMobile ? '2.2rem' : '3.5rem',
          fontWeight: 700,
          lineHeight: '1.1',
          margin: isMobile ? '0 0 15px 0' : '0 0 25px 0',
          textShadow: '0 4px 20px rgba(56,189,248,0.4)'
        }}>
          Hubble circles Earth every 95 minutes.
        </h1>

        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: isMobile ? '1.1rem' : '1.4rem',
          fontWeight: 500,
          lineHeight: '1.5',
          marginBottom: isMobile ? '25px' : '35px'
        }}>
          Since 1990 it has completed more than 200,000 orbits, travelling farther than a trip to Neptune and back.
        </p>

        <button style={{
          fontFamily: "'Orbitron', sans-serif",
          padding: isMobile ? '12px 24px' : '14px 32px',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          letterSpacing: '2px',
          color: '#fff',
          backgroundColor: 'transparent',
          border: '2px solid #38bdf8',
          borderRadius: '30px',
          cursor: 'pointer',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.4), inset 0 0 10px rgba(56, 189, 248, 0.2)',
          transition: 'all 0.3s ease',
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.8), inset 0 0 15px rgba(56, 189, 248, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.4), inset 0 0 10px rgba(56, 189, 248, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Explore Cosmos
        </button>
      </div>
    </div>
  );
};

export default HeroContent;
