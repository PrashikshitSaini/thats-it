import React, { useState, useEffect } from 'react';
import Draggable from './Draggable';
import { formatTimeRemaining, getUrgencyColor } from '../utils';

interface FloatingClockProps {
  remainingTime: number; // ms
  totalDuration: number;
  initialX: number;
  initialY: number;
}

const FloatingClock: React.FC<FloatingClockProps> = ({ remainingTime, totalDuration, initialX, initialY }) => {
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  const urgencyFactor = remainingTime > TEN_MINUTES_MS
    ? 1
    : Math.max(0, remainingTime / TEN_MINUTES_MS);

  const bgColor = getUrgencyColor(urgencyFactor);

  const isCritical = remainingTime < 60 * 1000; // Last minute
  const scaleClass = isCritical ? 'animate-pulse' : '';

  // Always movable based on user feedback
  const isMovable = true;

  // Handle hover to make widget interactive in Electron
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('widget-hover', true);
      } catch (e) {
        // Not in Electron, ignore
      }
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('widget-hover', false);
      } catch (e) {
        // Not in Electron, ignore
      }
    }
  };

  const [position, setPosition] = useState({ x: initialX, y: initialY });

  // Only set initial position if it's 0,0 (default)
  useEffect(() => {
    if (position.x === 0 && position.y === 0) {
      const newX = window.innerWidth - 150; // 150 approx width/padding
      const newY = 20;
      setPosition({ x: newX, y: newY });
    }
  }, []); // Only run once on mount

  return (
    <Draggable
      initialX={position.x}
      initialY={position.y}
      disabled={!isMovable}
      // We intentionally don't use the CSS class 'fixed top-2 right-4' anymore
      // because Draggable uses inline styles for position.
      className="pointer-events-auto z-50"
      // Force position update when state changes
      key={`${position.x}-${position.y}`}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-lg backdrop-blur-xl transition-colors duration-1000 border border-white/10 ${scaleClass}`}
          style={{
            backgroundColor: bgColor,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <span className="font-mono text-sm font-semibold text-white select-none tracking-tight">
            {formatTimeRemaining(remainingTime)}
          </span>
        </div>
      </div>
    </Draggable>
  );
};

export default FloatingClock;