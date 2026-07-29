import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Filters } from "../components/Filters";
import { OverviewPanel } from "../components/OverviewPanel";
import { SetupRequired } from "../components/SetupRequired";
import { Stat } from "../components/Stat";
import { SummaryTable } from "../components/SummaryTable";
import { env, hasSupabaseConfig } from "../lib/env";
import { chf, DateRangeKey, rangeFromKey, todayIso } from "../lib/format";
import { loadPublicReport } from "../lib/data";
import type { SummaryRow, WorkEntry, Payment, Expense } from "../lib/types";

type BossTab = "dashboard" | "employees" | "work" | "payments" | "expenses";

const bossTabs: { key: BossTab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "employees", label: "Employees" },
  { key: "work", label: "Work history" },
  { key: "payments", label: "Payments" },
  { key: "expenses", label: "Expenses" }
];

export default function BossReport() {
  const { token } = useParams();
  const navigate = useNavigate();
  const reportToken = token || env.bossReportToken || "";
  const initial = rangeFromKey("this_month");
  const isBossAuthed = localStorage.getItem("boss-session") === "true";
  const [activeTab, setActiveTab] = useState<BossTab>("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("this_month");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reportBalance, setReportBalance] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig || !isBossAuthed || !reportToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    loadPublicReport(reportToken, start, end)
      .then((report) => {
        setSummary(report.summary);
        setWorkEntries(report.work_entries);
        setPayments(report.payments);
        setExpenses(report.expenses);
        setReportBalance(Number(report.totals.remaining_balance || 0));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [end, isBossAuthed, reportToken, start]);

  const totals = useMemo(() => ({
    hours: summary.reduce((sum, row) => sum + row.total_hours, 0),
    earned: summary.reduce((sum, row) => sum + row.total_earned, 0),
    paid: summary.reduce((sum, row) => sum + row.total_paid, 0),
    salaryBalance: summary.reduce((sum, row) => sum + row.remaining_balance, 0),
    balance: reportBalance,
    expenses: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  }), [expenses, reportBalance, summary]);
  const selectedEmployee = summary.find((row) => row.employee_id === selectedEmployeeId);
  const filteredWorkEntries = selectedEmployeeId ? workEntries.filter((entry) => entry.employee_id === selectedEmployeeId) : workEntries;

  function changeRange(next: { rangeKey?: DateRangeKey; start?: string; end?: string }) {
    const key = next.rangeKey ?? rangeKey;
    const range = rangeFromKey(key, next.start ?? start, next.end ?? end);
    setRangeKey(key); setStart(next.start ?? range.start); setEnd(next.end ?? range.end);
  }

  function sendWhatsApp() {
    const text = `Golden Keys report (${start} to ${end})\nTo settle now: ${chf(totals.balance)}\nSalary balance: ${chf(totals.salaryBalance)}\nOther expenses total: ${chf(totals.balance - totals.salaryBalance)}\n\nSelected period:\nHours: ${totals.hours.toFixed(2)}\nEarned: ${chf(totals.earned)}\nPaid: ${chf(totals.paid)}\nExpenses: ${chf(totals.expenses)}`;
    const number = (env.bossWhatsappNumber || "").replace(/[^\d]/g, "");
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function bossLogout() {
    localStorage.removeItem("boss-session");
    navigate("/login", { replace: true });
  }

  function openEmployeeWork(row: SummaryRow) {
    setSelectedEmployeeId(row.employee_id);
    setActiveTab("work");
  }

  if (!hasSupabaseConfig) return <SetupRequired />;
  if (!isBossAuthed) return <Navigate to="/login" replace />;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-mint">Golden Keys</p>
            <h1 className="text-2xl font-bold text-ink">Boss report</h1>
            <p className="mt-1 text-sm text-slate-600">Read-only report. No add, edit, or delete actions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={bossLogout}>Log out</button>
            <button className="btn-primary" onClick={sendWhatsApp}><MessageCircle className="h-4 w-4" /> Send via WhatsApp</button>
          </div>
        </div>
        <Filters rangeKey={rangeKey} start={start} end={end} onChange={changeRange} />
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">This report link is invalid or inactive.</div>}
        <div className="card flex gap-2 overflow-x-auto p-2">
          {bossTabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? "btn-primary whitespace-nowrap" : "btn-secondary whitespace-nowrap"} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        {loading ? <div className="card p-4 text-sm text-slate-600">Loading report...</div> : (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-5">
                <OverviewPanel
                  totalOutstanding={totals.balance}
                  salaryOutstanding={totals.salaryBalance}
                  allExpenses={totals.balance - totals.salaryBalance}
                  periodHours={totals.hours}
                  periodEarned={totals.earned}
                  periodPaid={totals.paid}
                  periodExpenses={totals.expenses}
                  start={start}
                  end={end}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Hours worked" value={totals.hours.toFixed(2)} />
                  <Stat label="Salary earned" value={chf(totals.earned)} />
                  <Stat label="Paid" value={chf(totals.paid)} tone="green" />
                  <Stat label="Other expenses" value={chf(totals.expenses)} tone="warm" />
                </div>
                <ReadOnlyPayments payments={payments} title="Payments in selected period" />
                <SummaryTable rows={summary} linkEmployees={false} onEmployeeClick={openEmployeeWork} />
              </div>
            )}
            {activeTab === "employees" && <SummaryTable rows={summary} linkEmployees={false} onEmployeeClick={openEmployeeWork} />}
            {activeTab === "work" && <ReadOnlyWork entries={filteredWorkEntries} employeeName={selectedEmployee?.employee_name} onClearEmployee={() => setSelectedEmployeeId("")} />}
            {activeTab === "payments" && <ReadOnlyPayments payments={payments} />}
            {activeTab === "expenses" && <ReadOnlyExpenses expenses={expenses} />}
          </>
        )}
        <p className="text-xs text-slate-500">Generated {todayIso()}. Amounts are shown in CHF.</p>
      </div>
    </main>
  );
}

function ReadOnlyWork({ entries, employeeName, onClearEmployee }: { entries: WorkEntry[]; employeeName?: string; onClearEmployee: () => void }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold">Work history{employeeName ? ` - ${employeeName}` : ""}</h2>
        {employeeName && <button className="btn-secondary self-start sm:self-auto" onClick={onClearEmployee}>All employees</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3 text-right">Hours</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Salary</th><th className="px-4 py-3">Note</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{entries.map((entry) => <tr key={entry.id}><td className="px-4 py-3">{entry.work_date}</td><td className="px-4 py-3 font-semibold">{entry.employees?.name}</td><td className="px-4 py-3 text-right">{Number(entry.hours).toFixed(2)}</td><td className="px-4 py-3 text-right">{chf(Number(entry.hourly_rate))}</td><td className="px-4 py-3 text-right font-bold">{chf(Number(entry.hours) * Number(entry.hourly_rate))}</td><td className="px-4 py-3 text-slate-600">{entry.note || "-"}</td></tr>)}</tbody>
        </table>
      </div>
      {entries.length === 0 && <p className="p-4 text-sm text-slate-600">No work entries in this period.</p>}
    </section>
  );
}

function ReadOnlyPayments({ payments, title = "Payments" }: { payments: Payment[]; title?: string }) {
  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-slate-100 px-4 py-3 font-bold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Note</th><th className="px-4 py-3 text-right">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment.id}><td className="px-4 py-3">{payment.payment_date}</td><td className="px-4 py-3 font-semibold">{payment.employees?.name}</td><td className="px-4 py-3 uppercase">{payment.payment_method}</td><td className="px-4 py-3 text-slate-600">{payment.note || "-"}</td><td className="px-4 py-3 text-right font-bold">{chf(Number(payment.amount))}</td></tr>)}</tbody>
        </table>
      </div>
      {payments.length === 0 && <p className="p-4 text-sm text-slate-600">No payments in this period.</p>}
    </section>
  );
}

function ReadOnlyExpenses({ expenses }: { expenses: Expense[] }) {
  return (
    <section className="card overflow-hidden">
      <h2 className="border-b border-slate-100 px-4 py-3 font-bold">Expenses</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Note</th><th className="px-4 py-3 text-right">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{expenses.map((expense) => <tr key={expense.id}><td className="px-4 py-3">{expense.expense_date}</td><td className="px-4 py-3 text-slate-600">{expense.note || "-"}</td><td className="px-4 py-3 text-right font-bold">{chf(Number(expense.amount))}</td></tr>)}</tbody>
        </table>
      </div>
      {expenses.length === 0 && <p className="p-4 text-sm text-slate-600">No expenses in this period.</p>}
    </section>
  );
}
