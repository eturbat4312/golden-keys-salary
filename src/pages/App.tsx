import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout";
import { SetupRequired } from "../components/SetupRequired";
import { hasSupabaseConfig } from "../lib/env";
import { supabase } from "../lib/supabase";
import Dashboard from "./Dashboard";
import Employees from "./Employees";
import Expenses from "./Expenses";
import Payments from "./Payments";
import PaymentForm from "./PaymentForm";
import WorkEntryForm from "./WorkEntryForm";
import WorkHistory from "./WorkHistory";
import type { Role } from "../lib/types";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.session.user.id).single<{ role: Role }>();
      setRole(profile?.role ?? null);
      setLoading(false);
    });
  }, []);

  const content = useMemo(() => {
    if (!hasSupabaseConfig) return <SetupRequired />;
    if (loading) return <div className="p-6 text-sm text-slate-600">Loading...</div>;
    if (role === "boss") return <Navigate to="/boss" replace />;
    if (role !== "admin") return <Navigate to="/login" replace />;
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/work/new" element={<WorkEntryForm />} />
          <Route path="/work/:id" element={<WorkEntryForm />} />
          <Route path="/work" element={<WorkHistory />} />
          <Route path="/payments/new" element={<PaymentForm />} />
          <Route path="/payments/:id" element={<PaymentForm />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<Expenses />} />
        </Routes>
      </Layout>
    );
  }, [loading, role]);

  return content;
}
