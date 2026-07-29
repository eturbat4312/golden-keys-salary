import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filters } from "../components/Filters";
import { loadEmployees, loadPayments } from "../lib/data";
import { chf, DateRangeKey, rangeFromKey } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { Employee, Payment } from "../lib/types";

export default function Payments() {
  const initial = rangeFromKey("this_week");
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("this_week");
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const refresh = useCallback(async () => {
    setPayments(await loadPayments(start, end, employeeId || undefined));
  }, [employeeId, end, start]);

  useEffect(() => { loadEmployees(true).then(setEmployees); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  function changeRange(next: { rangeKey?: DateRangeKey; start?: string; end?: string }) {
    const key = next.rangeKey ?? rangeKey;
    const range = rangeFromKey(key, next.start ?? start, next.end ?? end);
    setRangeKey(key); setStart(next.start ?? range.start); setEnd(next.end ?? range.end);
  }

  async function remove(id: string) {
    if (!confirm("Delete this payment?")) return;
    await supabase.from("payments").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Payments</h2><Link className="btn-primary" to="/payments/new">Add payment</Link></div>
      <Filters rangeKey={rangeKey} start={start} end={end} onChange={changeRange} />
      <label className="block max-w-sm"><span className="label">Employee</span><select className="input mt-1" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Method</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment.id}><td className="px-4 py-3">{payment.payment_date}</td><td className="px-4 py-3 font-semibold">{payment.employees?.name}</td><td className="px-4 py-3 capitalize">{payment.payment_method}</td><td className="px-4 py-3 text-right font-bold">{chf(Number(payment.amount))}</td><td className="px-4 py-3 text-right"><Link className="btn-secondary" to={`/payments/${payment.id}`}>Edit</Link> <button className="btn-danger" onClick={() => remove(payment.id)}>Delete</button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
