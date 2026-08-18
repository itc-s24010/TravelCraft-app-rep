"use client";

interface ClockFaceProps { time: string; }

function ClockFace({ time }: ClockFaceProps) {
  if (!time) {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="#d1d5db" strokeWidth="1.5" />
        <line x1="11" y1="5" x2="11" y2="11" stroke="#d1d5db" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="11" y1="11" x2="15" y2="11" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11" cy="11" r="1.5" fill="#d1d5db" />
      </svg>
    );
  }
  const [h, m] = time.split(":").map(Number);
  const hourDeg = ((h % 12) / 12) * 360 + (m / 60) * 30;
  const minDeg = (m / 60) * 360;
  const toXY = (deg: number, r: number) => ({
    x: 11 + r * Math.sin((deg * Math.PI) / 180),
    y: 11 - r * Math.cos((deg * Math.PI) / 180),
  });
  const hEnd = toXY(hourDeg, 5);
  const mEnd = toXY(minDeg, 7.5);

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="10" stroke="rgb(var(--color-primary,99,102,241))" strokeWidth="1.5" opacity="0.35" />
      {/* tick marks */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg) => {
        const inner = toXY(deg, 8.5);
        const outer = toXY(deg, 10);
        return (
          <line key={deg} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke="rgb(var(--color-primary,99,102,241))" strokeWidth="0.8" opacity="0.3" />
        );
      })}
      {/* hour hand */}
      <line x1="11" y1="11" x2={hEnd.x} y2={hEnd.y}
        stroke="rgb(var(--color-primary,99,102,241))" strokeWidth="2" strokeLinecap="round" />
      {/* minute hand */}
      <line x1="11" y1="11" x2={mEnd.x} y2={mEnd.y}
        stroke="rgb(var(--color-primary,99,102,241))" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      <circle cx="11" cy="11" r="1.8" fill="rgb(var(--color-primary,99,102,241))" />
    </svg>
  );
}

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function DateTimePicker({ value, onChange, label, className }: DateTimePickerProps) {
  const datePart = value ? value.slice(0, 10) : "";
  const timePart = value ? value.slice(11, 16) : "";

  function handleDate(d: string) {
    if (!d) { onChange(""); return; }
    onChange(d + "T" + (timePart || "00:00"));
  }
  function handleTime(t: string) {
    if (!t) { onChange(datePart ? datePart + "T00:00" : ""); return; }
    onChange((datePart || new Date().toISOString().slice(0, 10)) + "T" + t);
  }

  return (
    <div className={className}>
      {label && <label className="block text-xs text-muted-foreground mb-1">{label}</label>}
      <div className="border border-border rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/40">
        {/* Date row */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-dashed border-border/60">
          <span className="text-base leading-none select-none">📅</span>
          <input
            type="date"
            value={datePart}
            onChange={(e) => handleDate(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none min-w-0"
          />
        </div>
        {/* Time row */}
        <div className="flex items-center gap-2.5 px-3 py-2 bg-primary/[0.03]">
          <div className="shrink-0">
            <ClockFace time={timePart} />
          </div>
          <input
            type="time"
            value={timePart}
            onChange={(e) => handleTime(e.target.value)}
            className="flex-1 text-sm font-semibold font-mono text-primary bg-transparent focus:outline-none min-w-0 tracking-wider"
          />
        </div>
      </div>
    </div>
  );
}

/* Date-only picker (for check-in / check-out) */
interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function DatePicker({ value, onChange, label, className }: DatePickerProps) {
  return (
    <div className={className}>
      {label && <label className="block text-xs text-muted-foreground mb-1">{label}</label>}
      <div className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary/40">
        <span className="text-base leading-none select-none">📅</span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm bg-transparent focus:outline-none min-w-0"
        />
      </div>
    </div>
  );
}
