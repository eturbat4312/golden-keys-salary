import { Link } from "react-router-dom";
import { chf } from "../lib/format";
import type { DateRangeKey } from "../lib/format";
import type { SummaryRow } from "../lib/types";

export function SummaryTable({
  rows,
  rangeKey,
  start,
  end,
  linkEmployees = true,
  onEmployeeClick
}: {
  rows: SummaryRow[];
  rangeKey?: DateRangeKey;
  start?: string;
  end?: string;
  linkEmployees?: boolean;
  onEmployeeClick?: (row: SummaryRow) => void;
}) {
  const totals = rows.reduce(
    (sum, row) => ({
      opening: sum.opening + row.opening_balance,
      hours: sum.hours + row.total_hours,
      earned: sum.earned + row.total_earned,
      paid: sum.paid + row.total_paid,
      balance: sum.balance + row.remaining_balance
    }),
    { opening: 0, hours: 0, earned: 0, paid: 0, balance: 0 }
  );

  function workHistoryLink(employeeId: string) {
    const params = new URLSearchParams({ employee: employeeId });
    if (rangeKey) params.set("range", rangeKey);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return `/work?${params.toString()}`;
  }

  function employeeName(row: SummaryRow) {
    if (onEmployeeClick) {
      return (
        <button className="font-semibold text-mint underline-offset-2 hover:underline" onClick={() => onEmployeeClick(row)}>
          {row.employee_name}
        </button>
      );
    }
    if (linkEmployees) {
      return (
        <Link className="font-semibold text-mint underline-offset-2 hover:underline" to={workHistoryLink(row.employee_id)}>
          {row.employee_name}
        </Link>
      );
    }
    return row.employee_name;
  }

  return (
    <div className="card overflow-hidden">
      <div className="mobile-card-list">
        {rows.map((row) => (
          <article className="mobile-row-card" key={row.employee_id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</p>
                <p className="mt-1 text-base font-bold text-ink">{employeeName(row)}</p>
              </div>
              <p className={`text-right text-lg font-black ${row.remaining_balance > 0 ? "text-coral" : "text-mint"}`}>{chf(row.remaining_balance)}</p>
            </div>
            <div className="mt-4 grid gap-2">
              <p className="mobile-kv"><span>Opening</span><span>{chf(row.opening_balance)}</span></p>
              <p className="mobile-kv"><span>Hours</span><span>{row.total_hours.toFixed(2)}</span></p>
              <p className="mobile-kv"><span>Earned</span><span>{chf(row.total_earned)}</span></p>
              <p className="mobile-kv"><span>Paid</span><span>{chf(row.total_paid)}</span></p>
            </div>
          </article>
        ))}
        {rows.length > 0 && (
          <article className="rounded-md bg-slate-900 p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold">Total balance</p>
              <p className="text-lg font-black">{chf(totals.balance)}</p>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-slate-200">
              <p className="flex justify-between gap-3"><span>Hours</span><span className="font-semibold text-white">{totals.hours.toFixed(2)}</span></p>
              <p className="flex justify-between gap-3"><span>Earned</span><span className="font-semibold text-white">{chf(totals.earned)}</span></p>
              <p className="flex justify-between gap-3"><span>Paid</span><span className="font-semibold text-white">{chf(totals.paid)}</span></p>
            </div>
          </article>
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3 text-right">Opening</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3 text-right">Earned</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.employee_id}>
                <td className="px-4 py-3 font-semibold">
                  {employeeName(row)}
                </td>
                <td className="px-4 py-3 text-right">{chf(row.opening_balance)}</td>
                <td className="px-4 py-3 text-right">{row.total_hours.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{chf(row.total_earned)}</td>
                <td className="px-4 py-3 text-right">{chf(row.total_paid)}</td>
                <td className={`px-4 py-3 text-right font-bold ${row.remaining_balance > 0 ? "text-coral" : "text-mint"}`}>{chf(row.remaining_balance)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-ink">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{chf(totals.opening)}</td>
                <td className="px-4 py-3 text-right">{totals.hours.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{chf(totals.earned)}</td>
                <td className="px-4 py-3 text-right">{chf(totals.paid)}</td>
                <td className={`px-4 py-3 text-right ${totals.balance > 0 ? "text-coral" : "text-mint"}`}>{chf(totals.balance)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {rows.length === 0 && <p className="p-4 text-sm text-slate-600">No data for this period.</p>}
    </div>
  );
}
