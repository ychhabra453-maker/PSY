import React, { useRef, useState, useCallback, useEffect } from 'react';

export interface JoystickVector {
  x: number; // -1 to 1
  y: number; // -1 to 1
  magnitude: number; // 0 to 1
  active: boolean;
}

interface VirtualJoystickProps {
  label: string;
  variant: 'move' | 'aim';
  size?: number;
  onMove: (vec: JoystickVector) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  label,
  variant,
  size = 156,
  onMove,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const maxRadius = size * 0.34;

  const updateVectorFromClientXY = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;
      setKnobPos({ x: kx, y: ky });

      const normMag = clampedDist / maxRadius;
      onMove({
        x: maxRadius > 0 ? kx / maxRadius : 0,
        y: maxRadius > 0 ? ky / maxRadius : 0,
        magnitude: normMag,
        active: true,
      });
    },
    [maxRadius, onMove]
  );

  const resetJoystick = useCallback(() => {
    pointerIdRef.current = null;
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0, magnitude: 0, active: false });
  }, [onMove]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    setIsActive(true);
    updateVectorFromClientXY(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateVectorFromClientXY(e.clientX, e.clientY);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    resetJoystick();
  };

  useEffect(() => {
    const onBlur = () => resetJoystick();
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [resetJoystick]);

  return (
    <div className="flex flex-col items-center select-none pointer-events-auto">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        style={{ width: size, height: size }}
        className="relative rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
      >
        {/* Top Label inside outer ring matching Screenshot 2 */}
        <span className="absolute top-3 text-[11px] font-extrabold tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] uppercase pointer-events-none">
          {label}
        </span>

        {/* Middle Concentric Ring */}
        <div
          style={{ width: size * 0.72, height: size * 0.72 }}
          className="rounded-full bg-white/10 border border-white/20 pointer-events-none"
        />

        {/* Draggable Purple / Lavender Knob */}
        <div
          style={{
            width: size * 0.46,
            height: size * 0.46,
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
            backgroundColor: variant === 'move' ? '#5E549A' : '#8576D6',
          }}
          className={`absolute rounded-full border-2 ${
            isActive ? 'border-white scale-105' : 'border-white/75'
          } shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75`}
        >
          {variant === 'move' ? (
            /* 4-way diamond directional icon matching MOVE + FLY */
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <polygon points="20,4 26,12 14,12" fill="white" />
              <polygon points="20,36 26,28 14,28" fill="white" />
              <polygon points="4,20 12,14 12,26" fill="white" />
              <polygon points="36,20 28,14 28,26" fill="white" />
              <rect x="15" y="15" width="10" height="10" fill="rgba(255,255,255,0.35)" />
            </svg>
          ) : (
            /* Crosshair target icon matching AIM + FIRE */
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <circle cx="20" cy="20" r="9" stroke="white" strokeWidth="3" />
              <line x1="20" y1="4" x2="20" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <line x1="20" y1="28" x2="20" y2="36" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <line x1="4" y1="20" x2="12" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <line x1="28" y1="20" x2="36" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
