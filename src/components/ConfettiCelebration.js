import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const ConfettiCelebration = ({ active = false }) => {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    const colors = ['#1565C0', '#C2185B', '#2E7D32', '#ED6C02', '#FFD700', '#0288D1'];

    const end = Date.now() + 800;

    (function burst() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        gravity: 1,
        scalar: 0.8,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        gravity: 1,
        scalar: 0.8,
      });

      if (Date.now() < end) {
        setTimeout(burst, 100);
      }
    })();

    confetti({
      particleCount: 30,
      spread: 60,
      startVelocity: 60,
      origin: { y: 0.6 },
      colors,
      gravity: 1,
      scalar: 0.8,
      ticks: 180,
    });
  }, [active]);

  return null;
};

export default ConfettiCelebration;
