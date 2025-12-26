import React, { useState, useEffect, useRef } from 'react';

interface DraggableProps {
  initialX: number;
  initialY: number;
  onPositionChange?: (x: number, y: number) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Draggable: React.FC<DraggableProps> = ({ initialX, initialY, onPositionChange, children, className, disabled = false }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // Update internal state if props change (e.g. window resize recalculation from parent)
  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;

    if (ref.current) {
      setIsDragging(true);
      const rect = ref.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        // Boundary checks (keep within window)
        const maxX = window.innerWidth - (ref.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (ref.current?.offsetHeight || 0);

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
      }
    };

    // Update position when window resizes to keep it at the right edge
    const handleResize = () => {
      if (ref.current) {
        const maxX = window.innerWidth - (ref.current.offsetWidth || 0);
        // If current position is near the right edge, keep it there
        if (position.x > maxX - 50) {
          setPosition(prev => ({ ...prev, x: maxX }));
        }
      }
    };

    window.addEventListener('resize', handleResize);

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange?.(position.x, position.y);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDragging, onPositionChange, position]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        cursor: disabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        zIndex: 40, // Below the LockScreen (50)
        touchAction: 'none'
      }}
      className={className}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

export default Draggable;
