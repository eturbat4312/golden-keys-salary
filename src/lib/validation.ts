import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  default_hourly_rate: z.coerce.number().min(0, "Rate cannot be negative"),
  opening_balance: z.coerce.number(),
  is_active: z.boolean()
});

export const workEntrySchema = z.object({
  employee_id: z.string().uuid("Employee is required"),
  work_date: z.string().min(1, "Date is required"),
  hours: z.coerce.number().positive("Hours must be greater than zero"),
  hourly_rate: z.coerce.number().min(0, "Rate cannot be negative"),
  note: z.string().trim().optional()
});

export const paymentSchema = z.object({
  employee_id: z.string().uuid("Employee is required"),
  payment_date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  payment_method: z.enum(["cash", "twint"]),
  note: z.string().trim().optional()
});

export const expenseSchema = z.object({
  expense_date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  category: z.string().trim().default("Other"),
  note: z.string().trim().optional()
});
