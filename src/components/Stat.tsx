export function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warm" | "green" }) {
  const color = tone === "warm" ? "text-coral" : tone === "green" ? "text-mint" : "text-ink";
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
