import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupRequired } from "../components/SetupRequired";
import { env, hasSupabaseConfig } from "../lib/env";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (username.trim() === env.bossUsername && password === env.bossPassword) {
      localStorage.setItem("boss-session", "true");
      navigate("/boss", { replace: true });
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: username.trim(), password });
    setLoading(false);
    if (signInError) setError(signInError.message);
    else navigate("/", { replace: true });
  }

  if (!hasSupabaseConfig) return <SetupRequired />;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <form className="card w-full max-w-md p-6" onSubmit={submit}>
        <p className="text-xs font-bold uppercase tracking-wide text-mint">Golden Keys</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Admin and boss access from one screen.</p>
        {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <label className="mt-5 block">
          <span className="label">Username or email</span>
          <input className="input mt-1" value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label className="mt-4 block">
          <span className="label">Password</span>
          <input className="input mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button className="btn-primary mt-5 w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}
