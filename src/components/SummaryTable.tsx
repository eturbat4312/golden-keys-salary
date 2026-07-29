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

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
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
                  {onEmployeeClick ? (
                    <button className="font-semibold text-mint underline-offset-2 hover:underline" onClick={() => onEmployeeClick(row)}>
                      {row.employee_name}
                    </button>
                  ) : linkEmployees ? (
                    <Link className="text-mint underline-offset-2 hover:underline" to={workHistoryLink(row.employee_id)}>
                      {row.employee_name}
                    </Link>
                  ) : row.employee_name}
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
