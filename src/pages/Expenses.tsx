import { useCallback, useEffect, useMemo, useState } from "react";
import { Filters } from "../components/Filters";
import { loadExpenses } from "../lib/data";
import { chf, DateRangeKey, rangeFromKey, todayIso } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { Expense } from "../lib/types";
import { expenseSchema } from "../lib/validation";

const empty = { expense_date: todayIso(), amount: "", note: "" };

export default function Expenses() {
  const initial = rangeFromKey("this_month");
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("this_month");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setExpenses(await loadExpenses(start, end));
  }, [end, start]);

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, [refresh]);

  const total = useMemo(() => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0), [expenses]);

  function changeRange(next: { rangeKey?: DateRangeKey; start?: string; end?: string }) {
    const key = next.rangeKey ?? rangeKey;
    const range = rangeFromKey(key, next.start ?? start, next.end ?? end);
    setRangeKey(key);
    setStart(next.start ?? range.start);
    setEnd(next.end ?? range.end);
  }

  async function save() {
    setError("");
    const parsed = expenseSchema.safeParse({ ...form, category: "Other" });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid expense");
      return;
    }
    const payload = { ...parsed.data, note: parsed.data.note || null };
    const result = editingId ? await supabase.from("expenses").update(payload).eq("id", editingId) : await supabase.from("expenses").insert(payload);
    if (result.error) setError(result.error.message);
    else {
      setForm(empty);
      setEditingId(null);
      refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this expense?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="card p-4">
        <h2 className="text-xl font-bold">{editingId ? "Edit expense" : "New expense"}</h2>
        {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mt-4 block"><span className="label">Date</span><input className="input mt-1" type="date" value={form.expense_date} onChange={(event) => setForm({ ...form, expense_date: event.target.value })} /></label>
        <label className="mt-4 block"><span className="label">Amount</span><input className="input mt-1" type="text" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
        <label className="mt-4 block"><span className="label">Note</span><textarea className="input mt-1 min-h-24" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
        <div className="mt-5 flex gap-2"><button className="btn-primary" onClick={save}>Save</button>{editingId && <button className="btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}</div>
      </section>
      <section className="space-y-4">
        <Filters rangeKey={rangeKey} start={start} end={end} onChange={changeRange} />
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Other expenses total</p><p className="mt-1 text-2xl font-bold text-coral">{chf(total)}</p></div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Note</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3"></th></tr></thead>
              <tbody className="divide-y divide-slate-100">{expenses.map((expense) => <tr key={expense.id}><td className="px-4 py-3">{expense.expense_date}</td><td className="px-4 py-3 text-slate-600">{expense.note}</td><td className="px-4 py-3 text-right font-bold">{chf(Number(expense.amount))}</td><td className="px-4 py-3 text-right"><button className="btn-secondary" onClick={() => { setEditingId(expense.id); setForm({ expense_date: expense.expense_date, amount: String(expense.amount), note: expense.note ?? "" }); }}>Edit</button> <button className="btn-danger" onClick={() => remove(expense.id)}>Delete</button></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
