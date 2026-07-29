import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Employee } from "../lib/types";
import { chf } from "../lib/format";
import { employeeSchema } from "../lib/validation";

const empty = { name: "", default_hourly_rate: "", opening_balance: "", is_active: true };

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    const { data, error: loadError } = await supabase.from("employees").select("*").order("name");
    if (loadError) setError(loadError.message);
    else setEmployees(data as Employee[]);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    setError("");
    const parsed = employeeSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid employee");
      return;
    }
    const result = editingId
      ? await supabase.from("employees").update(parsed.data).eq("id", editingId)
      : await supabase.from("employees").insert(parsed.data);
    if (result.error) setError(result.error.message);
    else {
      setForm(empty);
      setEditingId(null);
      refresh();
    }
  }

  async function remove(employee: Employee) {
    setError("");
    const [{ count: workCount, error: workError }, { count: paymentCount, error: paymentError }] = await Promise.all([
      supabase.from("work_entries").select("id", { count: "exact", head: true }).eq("employee_id", employee.id),
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("employee_id", employee.id)
    ]);
    if (workError || paymentError) {
      setError(workError?.message || paymentError?.message || "Could not check employee history");
      return;
    }

    const hasHistory = Boolean((workCount || 0) + (paymentCount || 0));
    if (hasHistory) {
      if (!confirm(`${employee.name} has work or payment history. Delete would remove payroll history. Mark inactive instead?`)) return;
      const { error: updateError } = await supabase.from("employees").update({ is_active: false }).eq("id", employee.id);
      if (updateError) setError(updateError.message);
      else refresh();
      return;
    }

    if (!confirm(`Delete ${employee.name}?`)) return;
    const { error: deleteError } = await supabase.from("employees").delete().eq("id", employee.id);
    if (deleteError) setError(deleteError.message);
    else {
      if (editingId === employee.id) {
        setEditingId(null);
        setForm(empty);
      }
      refresh();
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="card p-4">
        <h2 className="text-xl font-bold">{editingId ? "Edit employee" : "New employee"}</h2>
        {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="mt-4 block">
          <span className="label">Name</span>
          <input className="input mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="mt-4 block">
          <span className="label">Default hourly rate</span>
          <input className="input mt-1" type="text" inputMode="decimal" value={form.default_hourly_rate} onChange={(event) => setForm({ ...form, default_hourly_rate: event.target.value })} />
        </label>
        <label className="mt-4 block">
          <span className="label">Initial outstanding balance</span>
          <input className="input mt-1" type="text" inputMode="decimal" value={form.opening_balance} onChange={(event) => setForm({ ...form, opening_balance: event.target.value })} />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
          Active
        </label>
        <div className="mt-5 flex gap-2">
          <button className="btn-primary" onClick={save}>Save</button>
          {editingId && <button className="btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
        </div>
      </section>
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">Opening</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3 font-semibold">{employee.name}</td>
                  <td className="px-4 py-3">{chf(employee.default_hourly_rate)}</td>
                  <td className="px-4 py-3">{chf(employee.opening_balance || 0)}</td>
                  <td className="px-4 py-3">{employee.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary" onClick={() => { setEditingId(employee.id); setForm({ name: employee.name, default_hourly_rate: String(employee.default_hourly_rate), opening_balance: String(employee.opening_balance || 0), is_active: employee.is_active }); }}>Edit</button>
                      <button className="btn-danger" onClick={() => remove(employee)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
