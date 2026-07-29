import { chf } from "../lib/format";

export function OverviewPanel({
  totalOutstanding,
  salaryOutstanding,
  allExpenses,
  periodHours,
  periodEarned,
  periodPaid,
  periodExpenses,
  start,
  end
}: {
  totalOutstanding: number;
  salaryOutstanding: number;
  allExpenses: number;
  periodHours: number;
  periodEarned: number;
  periodPaid: number;
  periodExpenses: number;
  start: string;
  end: string;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      <div className="card border-coral/30 bg-orange-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-coral">To settle now</p>
        <p className="mt-2 text-4xl font-black text-ink">{chf(totalOutstanding)}</p>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-white p-3">
            <p className="text-slate-500">Salary balance</p>
            <p className="font-bold text-ink">{chf(salaryOutstanding)}</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-slate-500">Other expenses</p>
            <p className="font-bold text-ink">{chf(allExpenses)}</p>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-mint">Selected period</p>
        <p className="mt-1 text-sm font-semibold text-slate-600">{start} to {end}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-slate-500">Hours</p><p className="font-bold">{periodHours.toFixed(2)}</p></div>
          <div><p className="text-slate-500">Earned</p><p className="font-bold">{chf(periodEarned)}</p></div>
          <div><p className="text-slate-500">Paid</p><p className="font-bold">{chf(periodPaid)}</p></div>
          <div><p className="text-slate-500">Expenses</p><p className="font-bold">{chf(periodExpenses)}</p></div>
        </div>
      </div>
    </section>
  );
}
