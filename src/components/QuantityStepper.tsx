interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityStepper({ value, onChange, min = 0, max = 99 }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl font-semibold disabled:opacity-30 active:scale-90 transition-transform"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-6 text-center font-semibold text-lg tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-semibold disabled:opacity-30 active:scale-90 transition-transform"
        style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
