interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export default function ColorPicker({ label, value, onChange }: Props) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl border border-gray-200 flex-shrink-0 overflow-hidden cursor-pointer relative"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="input flex-1 font-mono text-sm"
          maxLength={7}
        />
      </div>
    </div>
  );
}
