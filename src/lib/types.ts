export type Role = "admin" | "boss";
export type PaymentMethod = "cash" | "twint";

export type Employee = {
  id: string;
  name: string;
  default_hourly_rate: number;
  opening_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkEntry = {
  id: string;
  employee_id: string;
  work_date: string;
  hours: number;
  hourly_rate: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  employees?: Pick<Employee, "name">;
};

export type Payment = {
  id: string;
  employee_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  employees?: Pick<Employee, "name">;
};

export type Expense = {
  id: string;
  expense_date: string;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export type SummaryRow = {
  employee_id: string;
  employee_name: string;
  opening_balance: number;
  total_hours: number;
  total_earned: number;
  total_paid: number;
  period_balance: number;
  remaining_balance: number;
};
