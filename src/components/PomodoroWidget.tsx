import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

export default function PomodoroWidget() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'shortBreak'>('focus');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            if (minutes === 0) {
              // Complete
              setIsRunning(false);
              setMinutes(mode === 'focus' ? 5 : 25);
              setMode(mode === 'focus' ? 'shortBreak' : 'focus');
              try {
                // Audio signal
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
              } catch (e) {}
              return 0;
            }
            setMinutes((m) => m - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, minutes, mode]);

  const toggle = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setMinutes(mode === 'focus' ? 25 : 5);
    setSeconds(0);
  };

  return (
    <div className="flex items-center gap-2 bg-[#e6fcf5] border border-[#c3fae8] rounded-full px-4.5 py-1.5 transition-all shadow-sm select-none">
      {/* Clickable toggle block */}
      <button 
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-bold text-[#0ca678] hover:text-[#099268] transition-colors cursor-pointer"
        title={isRunning ? "Pausar" : "Iniciar Foco"}
      >
        <Timer size={13.5} className={`text-[#0ca678] ${isRunning ? 'animate-pulse' : ''}`} />
        <span className="tabular-nums select-none">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </button>

      {/* Tiny separator and Reset Button */}
      <div className="h-3 w-[1px] bg-[#c3fae8] mx-0.5"></div>
      
      <button 
        onClick={reset}
        className="text-[#0ca678]/75 hover:text-[#0ca678] transition-colors cursor-pointer flex items-center justify-center p-0.5"
        title="Reiniciar foco"
      >
        <RotateCcw size={11} className="stroke-[2.5]" />
      </button>
    </div>
  );
}
