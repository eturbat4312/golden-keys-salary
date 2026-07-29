import { Copy, ExternalLink, MessageCircle } from "lucide-react";
import { addDays, format, isAfter, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Filters } from "../components/Filters";
import { OverviewPanel } from "../components/OverviewPanel";
import { Stat } from "../components/Stat";
import { SummaryTable } from "../components/SummaryTable";
import { loadEmployees, loadExpenses, loadPayments, loadTotals, loadWorkEntries } from "../lib/data";
import { chf, DateRangeKey, rangeFromKey, todayIso } from "../lib/format";
import type { Employee, Expense, Payment, SummaryRow, WorkEntry } from "../lib/types";
import { env } from "../lib/env";

export default function Dashboard() {
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("this_month");
  const initial = rangeFromKey("this_month");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [allExpenseTotal, setAllExpenseTotal] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [copyLabel, setCopyLabel] = useState("Copy boss link");
  const [loading, setLoading] = useState(true);
  const bossReportPath = env.bossReportToken ? "/boss" : "";
  const bossReportUrl = bossReportPath ? `${window.location.origin}${bossReportPath}` : "";

  useEffect(() => {
    setLoading(true);
    loadTotals(start, end)
      .then((report) => {
        setRows(report.rows);
        setExpenseTotal(report.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0));
        setAllExpenseTotal(report.allExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0));
        setPayments(report.payments);
      })
      .finally(() => setLoading(false));
  }, [start, end]);

  const totals = useMemo(
    () => ({
      hours: rows.reduce((sum, row) => sum + row.total_hours, 0),
      earned: rows.reduce((sum, row) => sum + row.total_earned, 0),
      paid: rows.reduce((sum, row) => sum + row.total_paid, 0),
      salaryBalance: rows.reduce((sum, row) => sum + row.remaining_balance, 0),
      balance: rows.reduce((sum, row) => sum + row.remaining_balance, 0) + allExpenseTotal
    }),
    [allExpenseTotal, rows]
  );

  function changeRange(next: { rangeKey?: DateRangeKey; start?: string; end?: string }) {
    const key = next.rangeKey ?? rangeKey;
    const range = rangeFromKey(key, next.start ?? start, next.end ?? end);
    setRangeKey(key);
    setStart(next.start ?? range.start);
    setEnd(next.end ?? range.end);
  }

  function sendTodayWhatsApp() {
    buildBossWhatsAppMessage().then((text) => {
      const number = (env.bossWhatsappNumber || "").replace(/[^\d]/g, "");
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    });
  }

  async function buildBossWhatsAppMessage() {
    const today = todayIso();
    const [employees, workEntries, payments, expenses] = await Promise.all([loadEmployees(true), loadWorkEntries(), loadPayments(), loadExpenses()]);
    const latestPaymentDate = payments.reduce<string | null>((latest, payment) => (!latest || payment.payment_date > latest ? payment.payment_date : latest), null);
    const periodStart = latestPaymentDate ? format(addDays(parseISO(latestPaymentDate), 1), "yyyy-MM-dd") : earliestActivityDate(workEntries, expenses, today);
    const baseBalance = calculateOutstanding(employees, workEntries, payments, expenses, latestPaymentDate);
    const currentBalance = calculateOutstanding(employees, workEntries, payments, expenses, today);
    const dailyLines = buildDailyLines(periodStart, today, workEntries, expenses);
    const lastPaidLine = latestPaymentDate ? `Last paid: ${format(parseISO(latestPaymentDate), "dd/MM/yy EEEE")}` : "Last paid: No payment recorded";

    return [
      "Golden Keys balance update",
      lastPaidLine,
      `Balance after last payment: ${chf(baseBalance)}`,
      "",
      "Since last payment:",
      dailyLines || "No new work or expenses since last payment.",
      "",
      `Remaining balance: ${chf(currentBalance)}`,
      ...(bossReportUrl ? ["", `Boss report: ${bossReportUrl}`] : [])
    ].join("\n");
  }

  async function copyBossLink() {
    if (!bossReportUrl) return;
    await navigator.clipboard.writeText(bossReportUrl);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy boss link"), 1800);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Admin view with calculated CHF totals from work entries and payments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {bossReportPath && (
            <>
              <Link className="btn-secondary" to={bossReportPath} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open boss view
              </Link>
              <button className="btn-secondary" onClick={copyBossLink}>
                <Copy className="h-4 w-4" /> {copyLabel}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={sendTodayWhatsApp}>
            <MessageCircle className="h-4 w-4" /> Send today to WhatsApp
          </button>
        </div>
      </div>
      <Filters rangeKey={rangeKey} start={start} end={end} onChange={changeRange} />
      <OverviewPanel
        totalOutstanding={totals.balance}
        salaryOutstanding={totals.salaryBalance}
        allExpenses={allExpenseTotal}
        periodHours={totals.hours}
        periodEarned={totals.earned}
        periodPaid={totals.paid}
        periodExpenses={expenseTotal}
        start={start}
        end={end}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Hours worked" value={totals.hours.toFixed(2)} />
        <Stat label="Salary earned" value={chf(totals.earned)} />
        <Stat label="Paid" value={chf(totals.paid)} tone="green" />
        <Stat label="Other expenses" value={chf(expenseTotal)} tone="warm" />
      </div>
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="font-bold text-ink">Payments in selected period</h3>
          <p className="text-sm font-bold text-mint">{chf(totals.paid)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Note</th><th className="px-4 py-3 text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3">{payment.payment_date}</td>
                  <td className="px-4 py-3 font-semibold">{payment.employees?.name}</td>
                  <td className="px-4 py-3 capitalize">{payment.payment_method}</td>
                  <td className="px-4 py-3 text-slate-600">{payment.note || "-"}</td>
                  <td className="px-4 py-3 text-right font-bold">{chf(Number(payment.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && <p className="p-4 text-sm text-slate-600">No payments in this period.</p>}
      </section>
      {loading ? <div className="card p-4 text-sm text-slate-600">Loading report...</div> : <SummaryTable rows={rows} rangeKey={rangeKey} start={start} end={end} />}
    </div>
  );
}

function earliestActivityDate(workEntries: WorkEntry[], expenses: Expense[], fallback: string) {
  const dates = [...workEntries.map((entry) => entry.work_date), ...expenses.map((expense) => expense.expense_date)].sort();
  return dates[0] || fallback;
}

function calculateOutstanding(employees: Employee[], workEntries: WorkEntry[], payments: Payment[], expenses: Expense[], untilDate: string | null) {
  const opening = employees.reduce((sum, employee) => sum + Number(employee.opening_balance || 0), 0);
  if (!untilDate) return opening;
  const earned = workEntries
    .filter((entry) => entry.work_date <= untilDate)
    .reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.hourly_rate), 0);
  const paid = payments
    .filter((payment) => payment.payment_date <= untilDate)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const expenseTotal = expenses
    .filter((expense) => expense.expense_date <= untilDate)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  return opening + earned - paid + expenseTotal;
}

function buildDailyLines(start: string, end: string, workEntries: WorkEntry[], expenses: Expense[]) {
  const lines: string[] = [];
  let cursor = parseISO(start);
  const endDate = parseISO(end);
  while (!isAfter(cursor, endDate)) {
    const iso = format(cursor, "yyyy-MM-dd");
    const earned = workEntries
      .filter((entry) => entry.work_date === iso)
      .reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.hourly_rate), 0);
    const expenseTotal = expenses
      .filter((expense) => expense.expense_date === iso)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    const total = earned + expenseTotal;
    if (total > 0) lines.push(`${format(cursor, "EEEE dd/MM")}: ${chf(total)}`);
    cursor = addDays(cursor, 1);
  }
  return lines.join("\n");
}
