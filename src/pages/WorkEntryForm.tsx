import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { loadEmployees } from "../lib/data";
import { env } from "../lib/env";
import { appLinkLine } from "../lib/app-url";
import { todayIso } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { Employee } from "../lib/types";
import { expenseSchema, workEntrySchema } from "../lib/validation";

export default function WorkEntryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState("");
  const [expenseError, setExpenseError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState({ employee_id: "", work_date: todayIso(), hours: "", hourly_rate: "", note: "" });
  const [expenseForm, setExpenseForm] = useState({ expense_date: todayIso(), amount: "", note: "" });

  useEffect(() => {
    loadEmployees(false).then(setEmployees).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase.from("work_entries").select("*").eq("id", id).single().then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message);
      if (data) setForm({ employee_id: data.employee_id, work_date: data.work_date, hours: String(data.hours), hourly_rate: String(data.hourly_rate), note: data.note ?? "" });
    });
  }, [id]);

  function selectEmployee(employeeId: string) {
    const employee = employees.find((item) => item.id === employeeId);
    setForm({ ...form, employee_id: employeeId, hourly_rate: employee ? String(employee.default_hourly_rate) : form.hourly_rate });
  }

  function hasExpenseDraft() {
    return expenseForm.amount.trim() !== "" || expenseForm.note.trim() !== "";
  }

  async function save() {
    setError("");
    setExpenseError("");
    setSavedMessage("");
    const parsed = workEntrySchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid work entry");
      return;
    }
    const parsedExpense = !id && hasExpenseDraft() ? expenseSchema.safeParse({ ...expenseForm, category: "Other" }) : null;
    if (parsedExpense && !parsedExpense.success) {
      setExpenseError(parsedExpense.error.issues[0]?.message ?? "Invalid expense");
      return;
    }
    const payload = { ...parsed.data, note: parsed.data.note || null };
    const result = id ? await supabase.from("work_entries").update(payload).eq("id", id) : await supabase.from("work_entries").insert(payload);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (parsedExpense?.success) {
      const expensePayload = { ...parsedExpense.data, note: parsedExpense.data.note || null };
      const expenseResult = await supabase.from("expenses").insert(expensePayload);
      if (expenseResult.error) {
        setExpenseError(`Hours saved, but expense was not saved: ${expenseResult.error.message}`);
        return;
      }
    }
    notifyBoss(parsed.data);
    navigate("/work");
  }

  function notifyBoss(work: { employee_id: string; work_date: string; hours: number; note?: string }) {
    const number = (env.bossWhatsappNumber || "").replace(/[^\d]/g, "");
    if (!number) return;
    const employee = employees.find((item) => item.id === work.employee_id);
    const employeeName = employee?.name || "Employee";
    const dateText = format(parseISO(work.work_date), "dd/MM/yy EEEE");
    const hoursText = Number(work.hours).toFixed(2).replace(/\.00$/, "");
    const noteText = work.note?.trim();
    const workText = noteText ? ` worked on ${noteText}` : " worked";
    const text = `${employeeName} ${dateText}\nTotal ${hoursText}hrs${workText}\n\n${appLinkLine()}`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function saveExpense() {
    setExpenseError("");
    setSavedMessage("");
    const parsed = expenseSchema.safeParse({ ...expenseForm, category: "Other" });
    if (!parsed.success) {
      setExpenseError(parsed.error.issues[0]?.message ?? "Invalid expense");
      return;
    }
    const payload = { ...parsed.data, note: parsed.data.note || null };
    const result = await supabase.from("expenses").insert(payload);
    if (result.error) setExpenseError(result.error.message);
    else {
      setExpenseForm({ expense_date: form.work_date || todayIso(), amount: "", note: "" });
      setSavedMessage("Expense saved.");
    }
  }

  return (
    <div className={`grid gap-4 sm:gap-5 ${id ? "mx-auto max-w-xl" : "lg:grid-cols-2"}`}>
      <section className="card p-4 sm:p-5">
        <h2 className="text-lg font-bold sm:text-xl">{id ? "Edit work entry" : "Add work entry"}</h2>
        {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mt-4 block">
          <span className="label">Employee</span>
          <select className="input mt-1" value={form.employee_id} onChange={(event) => selectEmployee(event.target.value)}>
            <option value="">Choose employee</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
          </select>
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label><span className="label">Date</span><input className="input mt-1" type="date" value={form.work_date} onChange={(event) => { setForm({ ...form, work_date: event.target.value }); if (!id) setExpenseForm((current) => ({ ...current, expense_date: event.target.value })); }} /></label>
          <label><span className="label">Hours</span><input className="input mt-1" type="text" inputMode="decimal" value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })} /></label>
          <label><span className="label">Hourly rate</span><input className="input mt-1" type="text" inputMode="decimal" value={form.hourly_rate} onChange={(event) => setForm({ ...form, hourly_rate: event.target.value })} /></label>
        </div>
        <label className="mt-4 block"><span className="label">Note</span><textarea className="input mt-1 min-h-24" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
        <div className="mobile-action-grid mt-5"><button className="btn-primary" onClick={save}>{!id && hasExpenseDraft() ? "Save hours and expense" : "Save hours"}</button><button className="btn-secondary" onClick={() => navigate("/work")}>Cancel</button></div>
      </section>
      {!id && (
        <section className="card p-4 sm:p-5">
          <h2 className="text-lg font-bold sm:text-xl">Other expense</h2>
          {expenseError && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{expenseError}</p>}
          {savedMessage && <p className="mt-3 rounded-md bg-teal-50 p-3 text-sm text-teal-700">{savedMessage}</p>}
          <label className="mt-4 block"><span className="label">Date</span><input className="input mt-1" type="date" value={expenseForm.expense_date} onChange={(event) => setExpenseForm({ ...expenseForm, expense_date: event.target.value })} /></label>
          <label className="mt-4 block"><span className="label">Amount</span><input className="input mt-1" type="text" inputMode="decimal" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} /></label>
          <label className="mt-4 block"><span className="label">Note</span><textarea className="input mt-1 min-h-24" value={expenseForm.note} onChange={(event) => setExpenseForm({ ...expenseForm, note: event.target.value })} /></label>
          <div className="mobile-action-grid mt-5"><button className="btn-primary" onClick={saveExpense}>Save expense</button><button className="btn-secondary" onClick={() => setExpenseForm({ expense_date: form.work_date || todayIso(), amount: "", note: "" })}>Clear</button></div>
        </section>
      )}
    </div>
  );
}
