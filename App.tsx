import React, { useState, useEffect, useRef } from 'react';
import SetupScreen from './components/SetupScreen';
import FloatingClock from './components/FloatingClock';
import LockScreen from './components/LockScreen';
import { AppState, AppStatus, TimeConfig } from './types';

// Constants
const TEN_MINUTES_MS = 10 * 60 * 1000;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    status: AppStatus.IDLE,
    endTime: null,
    password: '',
    // Position at extreme right, top of screen (like macOS notification panel)
    widgetPosition: { x: window.innerWidth - 200, y: 8 }, 
  });

  const [currentTime, setCurrentTime] = useState(Date.now());
  const animationFrameRef = useRef<number>();

  // Start the timer based on a specific daily time
  const handleStart = (timeConfig: TimeConfig, password: string) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), timeConfig.hours, timeConfig.minutes, 0, 0);

    // If the target time has already passed today, assume the user means the next occurrence (tomorrow)
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    setState(prev => ({
      ...prev,
      status: AppStatus.RUNNING,
      endTime: target.getTime(),
      password: password,
    }));
  };

  // Unlock the app
  const handleUnlock = () => {
    // Reset to idle
    setState(prev => ({
      ...prev,
      status: AppStatus.IDLE,
      endTime: null,
      password: '',
    }));
  };

  // Timer Logic
  useEffect(() => {
    const loop = () => {
      setCurrentTime(Date.now());
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    if (state.status === AppStatus.RUNNING) {
      loop();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [state.status]);

  // Check for lock condition
  useEffect(() => {
    if (state.status === AppStatus.RUNNING && state.endTime) {
      const remaining = state.endTime - currentTime;
      if (remaining <= 0) {
        setState(prev => ({ ...prev, status: AppStatus.LOCKED }));
      }
    }
  }, [currentTime, state.status, state.endTime]);

  // Control Electron window click-through and fullscreen based on app status
  useEffect(() => {
    // Check if we're running in Electron
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        
        if (state.status === AppStatus.IDLE) {
          // IDLE: Window should be interactive (not click-through), normal window
          ipcRenderer.send('stop-timer');
          ipcRenderer.send('set-click-through', false, 'IDLE');
        } else if (state.status === AppStatus.RUNNING) {
          // RUNNING: Go fullscreen overlay, window should be click-through (except widget area)
          ipcRenderer.send('start-timer');
          ipcRenderer.send('set-click-through', true, 'RUNNING');
        } else if (state.status === AppStatus.LOCKED) {
          // LOCKED: Window should block everything (not click-through), stay fullscreen, always on top
          // This is like ransomware - blocks all interaction until password is entered
          ipcRenderer.send('set-click-through', false, 'LOCKED');
        }
      } catch (e) {
        // Not in Electron, ignore
        console.log('Not running in Electron:', e);
      }
    }
  }, [state.status]);


  // Rendering Logic
  const remaining = state.endTime ? Math.max(0, state.endTime - currentTime) : 0;
  // Show widget when timer is running - ALWAYS show for entire duration
  // No time-based condition - show immediately when timer starts
  const shouldShowWidget = state.status === AppStatus.RUNNING && state.endTime !== null; 
  
  // Determine background and pointer events based on status
  // IDLE: Opaque background, interactive
  // RUNNING: Transparent background, NON-interactive (so you can click desktop), except widget
  // LOCKED: Opaque (handled by LockScreen), interactive
  let containerClass = "w-full h-full relative overflow-hidden transition-colors duration-500 ";
  
  if (state.status === AppStatus.IDLE) {
    containerClass += "bg-gradient-to-br from-slate-50 to-slate-100 pointer-events-auto text-slate-900";
  } else if (state.status === AppStatus.RUNNING) {
    containerClass += "bg-transparent pointer-events-none"; 
  } else {
    containerClass += "bg-transparent pointer-events-auto";
  }

  return (
    <div className={containerClass}>
      
      {/* Background decoration - Only show when IDLE */}
      {state.status === AppStatus.IDLE && (
         <div className="absolute inset-0 pointer-events-none opacity-5">
           <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#grid)" />
           </svg>
         </div>
      )}

      {/* Main Screens */}
      {state.status === AppStatus.IDLE && (
        <SetupScreen onStart={handleStart} />
      )}

      {/* When RUNNING, we do NOT show a full screen blocking div. We only show the widget if needed. */}
      {/* The pointer-events-none on the container allows clicks to pass through to the desktop in Electron */}
      
      {shouldShowWidget && (
        <FloatingClock 
          remainingTime={remaining}
          totalDuration={TEN_MINUTES_MS} 
          initialX={0}
          initialY={0}
        />
      )}

      {state.status === AppStatus.LOCKED && (
        <LockScreen 
          unlockPassword={state.password}
          onUnlock={handleUnlock}
        />
      )}

    </div>
  );
};

export default App;