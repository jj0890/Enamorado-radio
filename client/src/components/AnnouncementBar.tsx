import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

const DISMISS_KEY = 'enamorado-announce-v1';

const MESSAGES = [
  'Wanna be on Enamorado Radio? Submit your mix',
  'Apply to become a resident DJ — applications open',
  'Submit artwork, writing, or a track to the community',
];

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(DISMISS_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="relative overflow-hidden bg-blue h-[34px] flex items-center cursor-pointer"
      onClick={() => setLocation('/submit')}
    >
      {/* Double-content track for seamless loop */}
      <div className="animate-ticker flex whitespace-nowrap shrink-0">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {MESSAGES.map((msg, i) => (
              <span
                key={i}
                className="flex items-center gap-5 font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#0C0C0E] px-9"
              >
                {msg}
                <span className="w-[3px] h-[3px] rounded-full bg-[#0C0C0E] opacity-35 shrink-0" />
              </span>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#0C0C0E] opacity-40 hover:opacity-100 transition-opacity px-1 leading-none"
      >
        ✕
      </button>
    </div>
  );
}
