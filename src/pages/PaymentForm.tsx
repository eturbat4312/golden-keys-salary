import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentBalance, loadEmployees } from "../lib/data";
import { chf, todayIso } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { Employee, PaymentMethod } from "../lib/types";
import { paymentSchema } from "../lib/validation";

export default function PaymentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [balance, setBalance] = useState({ openingBalance: 0, totalEarned: 0, totalPaid: 0, remaining: 0 });
  const [error, setError] = useState("");
  const [form, setForm] = useState({ employee_id: "", payment_date: todayIso(), amount: "", payment_method: "cash" as PaymentMethod, note: "" });

  useEffect(() => { loadEmployees(false).then(setEmployees).catch((err) => setError(err.message)); }, []);
  useEffect(() => {
    if (!id) return;
    supabase.from("payments").select("*").eq("id", id).single().then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message);
      if (data) setForm({ employee_id: data.employee_id, payment_date: data.payment_date, amount: String(data.amount), payment_method: data.payment_method, note: data.note ?? "" });
    });
  }, [id]);
  useEffect(() => {
    if (form.employee_id) getCurrentBalance(form.employee_id).then(setBalance);
  }, [form.employee_id]);

  async function save() {
    setError("");
    const parsed = paymentSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Invalid payment"); return; }
    if (parsed.data.amount > balance.remaining && !confirm("This payment is higher than the current remaining balance. Save overpayment?")) return;
    const payload = { ...parsed.data, note: parsed.data.note || null };
    const result = id ? await supabase.from("payments").update(payload).eq("id", id) : await supabase.from("payments").insert(payload);
    if (result.error) setError(result.error.message);
    else navigate("/payments");
  }

  return (
    <section className="card mx-auto max-w-xl p-4">
      <h2 className="text-xl font-bold">{id ? "Edit payment" : "Add payment"}</h2>
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="mt-4 block"><span className="label">Employee</span><select className="input mt-1" value={form.employee_id} onChange={(event) => setForm({ ...form, employee_id: event.target.value })}><option value="">Choose employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
      <div className="mt-4 grid gap-4 sm:grid-cols-3"><label><span className="label">Date</span><input className="input mt-1" type="date" value={form.payment_date} onChange={(event) => setForm({ ...form, payment_date: event.target.value })} /></label><label><span className="label">Amount</span><input className="input mt-1" type="text" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label><span className="label">Method</span><select className="input mt-1" value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value as PaymentMethod })}><option value="cash">Cash</option><option value="twint">TWINT</option></select></label></div>
      <div className="mt-4 grid gap-2 rounded-md bg-slate-100 p-3 text-sm"><p>Initial outstanding: <strong>{chf(balance.openingBalance)}</strong></p><p>Earned: <strong>{chf(balance.totalEarned)}</strong></p><p>Already paid: <strong>{chf(balance.totalPaid)}</strong></p><p>Current remaining: <strong>{chf(balance.remaining)}</strong></p><p>After payment: <strong className={balance.remaining - Number(form.amount || 0) < 0 ? "text-coral" : "text-mint"}>{chf(balance.remaining - Number(form.amount || 0))}</strong></p></div>
      <label className="mt-4 block"><span className="label">Note</span><textarea className="input mt-1 min-h-24" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
      <div className="mt-5 flex gap-2"><button className="btn-primary" onClick={save}>Save</button><button className="btn-secondary" onClick={() => navigate("/payments")}>Cancel</button></div>
    </section>
  );
}
