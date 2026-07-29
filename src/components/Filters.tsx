import type { DateRangeKey } from "../lib/format";

export function Filters({
  rangeKey,
  start,
  end,
  onChange
}: {
  rangeKey: DateRangeKey;
  start: string;
  end: string;
  onChange: (next: { rangeKey?: DateRangeKey; start?: string; end?: string }) => void;
}) {
  return (
    <div className="card grid gap-3 p-3 md:grid-cols-[1fr_auto_auto] md:items-end">
      <label>
        <span className="label">Period</span>
        <select className="input mt-1" value={rangeKey} onChange={(event) => onChange({ rangeKey: event.target.value as DateRangeKey })}>
          <option value="this_week">This week</option>
          <option value="last_week">Last week</option>
          <option value="this_month">This month</option>
          <option value="last_month">Last month</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <label>
        <span className="label">Start</span>
        <input className="input mt-1" type="date" value={start} onChange={(event) => onChange({ rangeKey: "custom", start: event.target.value })} />
      </label>
      <label>
        <span className="label">End</span>
        <input className="input mt-1" type="date" value={end} onChange={(event) => onChange({ rangeKey: "custom", end: event.target.value })} />
      </label>
    </div>
  );
}
