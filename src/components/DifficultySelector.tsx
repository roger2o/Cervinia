import { useState } from 'react';
import type { DifficultyPreference } from '../types/graph';
import { PREFERENCE_COLORS, PREFERENCE_LABELS, PREFERENCE_ORDER } from '../data/difficultyMap';

interface DifficultySelectorProps {
  value: DifficultyPreference;
  onChange: (d: DifficultyPreference) => void;
}

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase"
      >
        Difficulty:
        <span
          className="font-bold"
          style={{ color: PREFERENCE_COLORS[value] }}
        >
          {PREFERENCE_LABELS[value]}
        </span>
        <span className="text-[10px] text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="flex gap-1 mt-1">
          {PREFERENCE_ORDER.map((d) => (
            <button
              key={d}
              onClick={() => {
                onChange(d);
                setOpen(false);
              }}
              className={`flex-1 px-1 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all ${
                value === d
                  ? 'border-current shadow-md scale-105'
                  : 'border-transparent opacity-60 hover:opacity-80'
              }`}
              style={{
                color: PREFERENCE_COLORS[d],
                backgroundColor: value === d ? `${PREFERENCE_COLORS[d]}15` : 'transparent',
              }}
            >
              {PREFERENCE_LABELS[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
