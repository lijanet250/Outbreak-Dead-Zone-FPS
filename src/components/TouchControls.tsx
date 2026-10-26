import React, { useRef, useEffect, useState } from 'react';
import { Target, Crosshair, ArrowUp, RotateCcw } from 'lucide-react';

interface TouchControlsProps {
  onMove: (x: number, y: number) => void;
  onLook: (dx: number, dy: number) => void;
  onFire: (firing: boolean) => void;
  onAim: (aiming: boolean) => void;
  onJump: () => void;
  onReload: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onLook,
  onFire,
  onAim,
  onJump,
  onReload,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const moveTouchId = useRef<number | null>(null);
  const moveStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    // Detect if device supports touch
    const checkTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(checkTouch);
  }, []);

  if (!isTouchDevice) return null;

  // Move joystick handlers
  const handleMoveStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    moveTouchId.current = touch.identifier;
    moveStartPos.current = { x: touch.clientX, y: touch.clientY };
    setStickOffset({ x: 0, y: 0 });
  };

  const handleMoveMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchId.current) {
        const dx = touch.clientX - moveStartPos.current.x;
        const dy = touch.clientY - moveStartPos.current.y;
        const maxRadius = 45;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        setStickOffset({ x: clampedX, y: clampedY });
        onMove(clampedX / maxRadius, clampedY / maxRadius);
        break;
      }
    }
  };

  const handleMoveEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchId.current) {
        moveTouchId.current = null;
        setStickOffset({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  // Look touchpad handlers
  const handleLookStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (lookTouchId.current === null) {
      lookTouchId.current = touch.identifier;
      lastLookPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLookMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        onLook(dx, dy);
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        break;
      }
    }
  };

  const toggleAim = () => {
    const next = !isAiming;
    setIsAiming(next);
    onAim(next);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
      {/* Move virtual stick (Bottom Left) */}
      <div
        className="absolute bottom-24 left-8 w-32 h-32 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm pointer-events-auto flex items-center justify-center"
        onTouchStart={handleMoveStart}
        onTouchMove={handleMoveMove}
        onTouchEnd={handleMoveEnd}
        onTouchCancel={handleMoveEnd}
      >
        <div
          className="w-12 h-12 rounded-full bg-white/40 border border-white/60 shadow"
          style={{ transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)` }}
        />
      </div>

      {/* Look swipe area (Right Half of Screen) */}
      <div
        className="absolute top-1/4 right-0 w-1/2 h-2/3 pointer-events-auto"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Action Buttons (Bottom Right) */}
      <div className="absolute bottom-24 right-8 flex flex-col gap-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Aim Down Sights */}
          <button
            onClick={toggleAim}
            className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border cursor-pointer ${
              isAiming ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/60 text-white border-white/30'
            }`}
          >
            <Target className="w-6 h-6" />
          </button>

          {/* Jump */}
          <button
            onClick={onJump}
            className="w-14 h-14 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white font-bold text-xs shadow-lg active:scale-95 cursor-pointer"
          >
            <ArrowUp className="w-6 h-6" />
          </button>

          {/* Reload */}
          <button
            onClick={onReload}
            className="w-14 h-14 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white font-bold text-xs shadow-lg active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Big Fire Button */}
        <button
          onTouchStart={() => onFire(true)}
          onTouchEnd={() => onFire(false)}
          className="w-20 h-20 self-end rounded-full bg-red-600/90 border-2 border-red-400 flex items-center justify-center text-white font-black text-sm shadow-xl active:scale-95 cursor-pointer"
        >
          <Crosshair className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
