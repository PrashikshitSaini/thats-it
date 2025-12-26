export const formatTimeRemaining = (ms: number): string => {
  if (ms <= 0) return "00:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  
  // Show HH:MM if 1 hour or more, otherwise MM:SS
  // This is time-based: shows hours and minutes for longer durations
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Interpolates between Green (#22c55e), Yellow (#eab308), and Red (#ef4444)
 * based on percentage (0 to 1). 
 * 1 = Green (Lots of time)
 * 0 = Red (No time)
 */
export const getUrgencyColor = (percentage: number): string => {
  // Clamp percentage between 0 and 1
  const p = Math.max(0, Math.min(1, percentage));

  // If p > 0.5, interpolate Green to Yellow
  // If p <= 0.5, interpolate Yellow to Red
  
  if (p > 0.5) {
    // 0.5 -> 0 (Yellow), 1.0 -> 1 (Green)
    // Normalize p to 0-1 range for this segment
    const segmentP = (p - 0.5) * 2; 
    // Green: [34, 197, 94], Yellow: [234, 179, 8]
    const r = Math.round(234 + (34 - 234) * segmentP);
    const g = Math.round(179 + (197 - 179) * segmentP);
    const b = Math.round(8 + (94 - 8) * segmentP);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // 0.0 -> 0 (Red), 0.5 -> 1 (Yellow)
    const segmentP = p * 2;
    // Red: [239, 68, 68], Yellow: [234, 179, 8]
    const r = Math.round(239 + (234 - 239) * segmentP);
    const g = Math.round(68 + (179 - 68) * segmentP);
    const b = Math.round(68 + (8 - 68) * segmentP);
    return `rgb(${r}, ${g}, ${b})`;
  }
};
