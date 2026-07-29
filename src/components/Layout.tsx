import { LogOut, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "../lib/supabase";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/employees", label: "Employees" },
  { to: "/work/new", label: "Add hours" },
  { to: "/work", label: "Work history" },
  { to: "/payments/new", label: "Add payment" },
  { to: "/payments", label: "Payments" },
  { to: "/expenses", label: "Expenses" }
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-4">
          <Menu className="h-5 w-5 text-mint md:hidden" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-mint">Golden Keys</p>
            <h1 className="truncate text-base font-bold text-ink sm:text-lg">Work hours and salary</h1>
          </div>
          <button className="btn-secondary shrink-0" onClick={() => supabase.auth.signOut()}>
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl snap-x gap-1 overflow-x-auto px-3 pb-3 sm:px-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `snap-start whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${isActive ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-slate-100"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">{children}</main>
    </div>
  );
}
