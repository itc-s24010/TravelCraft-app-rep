"use client";

import { useState } from "react";

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
      <circle cx="11" cy="11" r="10" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.35" />
      {/* tick marks */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg) => {
        const inner = toXY(deg, 8.5);
        const outer = toXY(deg, 10);
        return (
          <line key={deg} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke="var(--color-primary)" strokeWidth="0.8" opacity="0.3" />
        );
      })}
      {/* hour hand */}
      <line x1="11" y1="11" x2={hEnd.x} y2={hEnd.y}
        stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      {/* minute hand */}
      <line x1="11" y1="11" x2={mEnd.x} y2={mEnd.y}
        stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      <circle cx="11" cy="11" r="1.8" fill="var(--color-primary)" />
    </svg>
  );
}

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const QUICK_TIMES = ["06:00", "08:00", "09:00", "12:00", "15:00", "18:00", "20:00", "22:00"];
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

export function DateTimePicker({ value, onChange, label, className }: DateTimePickerProps) {
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerStep, setTimePickerStep] = useState<"hour" | "minute">("hour");
  const [selectedHour, setSelectedHour] = useState("09");
  const datePart = value ? value.slice(0, 10) : "";
  const timePart = value ? value.slice(11, 16) : "";

  function todayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function handleDate(d: string) {
    if (!d) { onChange(""); return; }
    onChange(d + "T" + (timePart || "00:00"));
  }
  function handleTime(t: string) {
    if (!t) { onChange(datePart ? datePart + "T00:00" : ""); return; }
    onChange((datePart || todayDate()) + "T" + t);
  }
  function openTimePicker() {
    setSelectedHour(timePart ? timePart.slice(0, 2) : "09");
    setTimePickerStep("hour");
    setTimePickerOpen(true);
  }
  function selectHour(hour: string) {
    setSelectedHour(hour);
    setTimePickerStep("minute");
  }
  function selectMinute(minute: string) {
    handleTime(`${selectedHour}:${minute}`);
    setTimePickerOpen(false);
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
          <button
            type="button"
            onClick={openTimePicker}
            aria-label="時計で時間を設定"
            title="時計で時間を設定"
            className="shrink-0 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <ClockFace time={timePart} />
          </button>
          <input
            type="time"
            value={timePart}
            onChange={(e) => handleTime(e.target.value)}
            className="flex-1 text-sm font-semibold font-mono text-primary bg-transparent focus:outline-none min-w-0 tracking-wider"
          />
        </div>
        {timePickerOpen && (
          <div className="border-t border-border/70 bg-muted/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">
                {timePickerStep === "hour" ? "時間を選択" : `${selectedHour}時の分を選択`}
              </p>
              {timePickerStep === "minute" && (
                <button
                  type="button"
                  onClick={() => setTimePickerStep("hour")}
                  className="text-xs text-primary hover:underline"
                >
                  時間に戻る
                </button>
              )}
            </div>
            {timePickerStep === "hour" ? (
              <div className="grid grid-cols-6 gap-1.5">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => selectHour(hour)}
                    className={`rounded-md border py-1.5 text-xs font-medium transition-colors ${
                      timePart.slice(0, 2) === hour
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    {hour}時
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {MINUTES.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => selectMinute(minute)}
                    className={`rounded-md border py-2 text-sm font-medium transition-colors ${
                      timePart.slice(3, 5) === minute
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    {minute}分
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
          <span className="w-full text-[10px] text-muted-foreground">よく使う時刻</span>
          {QUICK_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => handleTime(time)}
              aria-label={`${time}を選択`}
              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                timePart === time
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {time}
            </button>
          ))}
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
