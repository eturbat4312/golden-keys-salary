import { supabase } from "./supabase";
import type { Employee, Expense, Payment, SummaryRow, WorkEntry } from "./types";

export async function loadEmployees(includeInactive = true) {
  let query = supabase.from("employees").select("*").order("name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data as Employee[];
}

export async function loadWorkEntries(start?: string, end?: string, employeeId?: string) {
  let query = supabase
    .from("work_entries")
    .select("*, employees(name)")
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (start) query = query.gte("work_date", start);
  if (end) query = query.lte("work_date", end);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error } = await query;
  if (error) throw error;
  return data as WorkEntry[];
}

export async function loadPayments(start?: string, end?: string, employeeId?: string) {
  let query = supabase
    .from("payments")
    .select("*, employees(name)")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (start) query = query.gte("payment_date", start);
  if (end) query = query.lte("payment_date", end);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Payment[];
}

export async function loadExpenses(start?: string, end?: string) {
  let query = supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (start) query = query.gte("expense_date", start);
  if (end) query = query.lte("expense_date", end);
  const { data, error } = await query;
  if (error) throw error;
  return data as Expense[];
}

export async function loadTotals(start?: string, end?: string) {
  const [employees, workEntries, payments, allWorkEntries, allPayments, expenses, allExpenses] = await Promise.all([
    loadEmployees(true),
    loadWorkEntries(start, end),
    loadPayments(start, end),
    loadWorkEntries(),
    loadPayments(),
    loadExpenses(start, end),
    loadExpenses()
  ]);
  return { rows: calculateSummary(employees, workEntries, payments, allWorkEntries, allPayments), workEntries, payments, expenses, allExpenses };
}

export function calculateSummary(employees: Employee[], workEntries: WorkEntry[], payments: Payment[], balanceWorkEntries = workEntries, balancePayments = payments): SummaryRow[] {
  return employees.map((employee) => {
    const employeeWork = workEntries.filter((entry) => entry.employee_id === employee.id);
    const employeePayments = payments.filter((payment) => payment.employee_id === employee.id);
    const employeeBalanceWork = balanceWorkEntries.filter((entry) => entry.employee_id === employee.id);
    const employeeBalancePayments = balancePayments.filter((payment) => payment.employee_id === employee.id);
    const opening_balance = Number(employee.opening_balance || 0);
    const total_hours = employeeWork.reduce((sum, entry) => sum + Number(entry.hours), 0);
    const total_earned = employeeWork.reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.hourly_rate), 0);
    const total_paid = employeePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const balance_earned = employeeBalanceWork.reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.hourly_rate), 0);
    const balance_paid = employeeBalancePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return {
      employee_id: employee.id,
      employee_name: employee.name,
      opening_balance,
      total_hours,
      total_earned,
      total_paid,
      remaining_balance: opening_balance + balance_earned - balance_paid
    };
  });
}

export async function getCurrentBalance(employeeId: string) {
  const [employees, workEntries, payments] = await Promise.all([loadEmployees(true), loadWorkEntries(undefined, undefined, employeeId), loadPayments(undefined, undefined, employeeId)]);
  const openingBalance = Number(employees.find((employee) => employee.id === employeeId)?.opening_balance || 0);
  const totalEarned = workEntries.reduce((sum, entry) => sum + Number(entry.hours) * Number(entry.hourly_rate), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  return { openingBalance, totalEarned, totalPaid, remaining: openingBalance + totalEarned - totalPaid };
}
