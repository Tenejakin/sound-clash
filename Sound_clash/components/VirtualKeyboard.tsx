import React from 'react';

interface VirtualKeyboardProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
  maxLength?: number;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Č'],
  ['Š', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'Ž'],
];

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  value,
  onChange,
  onSubmit,
  maxLength = 20,
}) => {
  const press = (k: string) => {
    if (value.length >= maxLength) return;
    onChange(value + k);
  };
  const backspace = () => onChange(value.slice(0, -1));
  const space = () => press(' ');

  const keyBase =
    'h-14 rounded-xl border text-white font-black select-none ' +
    'active:scale-95 transition-all';
  const letterKey =
    `${keyBase} flex-1 min-w-[44px] max-w-[64px] text-2xl ` +
    'bg-white/10 border-white/30 active:bg-white/40';

  return (
    <div
      className="w-full max-w-2xl flex flex-col gap-2 select-none px-2"
      onMouseDown={(e) => e.preventDefault()}
    >
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-2">
          {row.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className={letterKey}
            >
              {k}
            </button>
          ))}
        </div>
      ))}

      <div className="flex justify-center gap-2 mt-1">
        <button
          type="button"
          onClick={backspace}
          className={`${keyBase} px-6 text-2xl bg-red-500/20 border-red-500/40 text-red-200 active:bg-red-500/40`}
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={space}
          className={`${keyBase} flex-1 max-w-md text-sm tracking-[0.4em] bg-white/10 border-white/30 active:bg-white/40`}
        >
          SPACE
        </button>
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            className={`${keyBase} px-6 text-2xl bg-green-500/30 border-green-500/60 active:bg-green-500/60 disabled:opacity-30`}
          >
            ✓
          </button>
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
