const MACROS = [
  { key: "protein_g", label: "Protein" },
  { key: "carbs_g", label: "Carbs" },
  { key: "fat_g", label: "Fat" },
] as const;

export function MacroRow({
  protein_g,
  carbs_g,
  fat_g,
}: {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}) {
  const values = { protein_g, carbs_g, fat_g };

  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {MACROS.map((macro) => (
        <div
          key={macro.key}
          className="rounded-2xl bg-card px-3 py-3 text-center"
        >
          <p className="font-display text-xl font-semibold text-ink-strong">
            {Math.round(values[macro.key])}
            <span className="text-sm font-medium text-ink-strong/60">g</span>
          </p>
          <p className="text-xs font-medium text-ink-strong/60">
            {macro.label}
          </p>
        </div>
      ))}
    </div>
  );
}
