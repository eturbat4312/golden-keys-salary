import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filters } from "../components/Filters";
import { loadEmployees, loadWorkEntries } from "../lib/data";
import { chf, DateRangeKey, rangeFromKey } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { Employee, WorkEntry } from "../lib/types";

export default function WorkHistory() {
  const [searchParams] = useSearchParams();
  const rangeParam = searchParams.get("range");
  const initialRangeKey = isDateRangeKey(rangeParam) ? rangeParam : "this_week";
  const initial = rangeFromKey(initialRangeKey, searchParams.get("start") || undefined, searchParams.get("end") || undefined);
  const [rangeKey, setRangeKey] = useState<DateRangeKey>(initialRangeKey);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [employeeId, setEmployeeId] = useState(searchParams.get("employee") || "");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<WorkEntry[]>([]);

  const refresh = useCallback(async () => {
    setEntries(await loadWorkEntries(start, end, employeeId || undefined));
  }, [employeeId, end, start]);

  useEffect(() => { loadEmployees(true).then(setEmployees); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  function changeRange(next: { rangeKey?: DateRangeKey; start?: string; end?: string }) {
    const key = next.rangeKey ?? rangeKey;
    const range = rangeFromKey(key, next.start ?? start, next.end ?? end);
    setRangeKey(key); setStart(next.start ?? range.start); setEnd(next.end ?? range.end);
  }

  async function remove(id: string) {
    if (!confirm("Delete this work entry?")) return;
    await supabase.from("work_entries").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-bold">Work history</h2><Link className="btn-primary" to="/work/new">Add hours</Link></div>
      <Filters rangeKey={rangeKey} start={start} end={end} onChange={changeRange} />
      <label className="block max-w-sm"><span className="label">Employee</span><select className="input mt-1" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label>
      <div className="grid gap-3 md:hidden">
        {entries.map((entry) => <article className="card p-4" key={entry.id}><div className="flex justify-between gap-3"><div><p className="font-bold">{entry.employees?.name}</p><p className="text-sm text-slate-600">{entry.work_date}</p></div><p className="font-bold">{chf(Number(entry.hours) * Number(entry.hourly_rate))}</p></div><p className="mt-2 text-sm">{Number(entry.hours).toFixed(2)}h x {chf(Number(entry.hourly_rate))}</p><div className="mt-3 flex gap-2"><Link className="btn-secondary" to={`/work/${entry.id}`}>Edit</Link><button className="btn-danger" onClick={() => remove(entry.id)}>Delete</button></div></article>)}
      </div>
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3 text-right">Hours</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Salary</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((entry) => <tr key={entry.id}><td className="px-4 py-3">{entry.work_date}</td><td className="px-4 py-3 font-semibold">{entry.employees?.name}</td><td className="px-4 py-3 text-right">{Number(entry.hours).toFixed(2)}</td><td className="px-4 py-3 text-right">{chf(Number(entry.hourly_rate))}</td><td className="px-4 py-3 text-right font-bold">{chf(Number(entry.hours) * Number(entry.hourly_rate))}</td><td className="px-4 py-3 text-right"><Link className="btn-secondary" to={`/work/${entry.id}`}>Edit</Link> <button className="btn-danger" onClick={() => remove(entry.id)}>Delete</button></td></tr>)}</tbody></table>
      </div>
    </div>
  );
}

function isDateRangeKey(value: string | null): value is DateRangeKey {
  return value === "this_week" || value === "last_week" || value === "this_month" || value === "last_month" || value === "custom";
}
