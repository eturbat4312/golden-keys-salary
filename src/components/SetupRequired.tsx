export function SetupRequired() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="card w-full max-w-xl p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-mint">Golden Keys</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Supabase setup required</h1>
        <p className="mt-3 text-sm text-slate-600">
          Create a local `.env` file from `.env.example`, then add your Supabase project URL and anon key.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-white">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BOSS_WHATSAPP_NUMBER=41788664979`}
        </pre>
        <p className="mt-4 text-sm text-slate-600">After saving `.env`, restart the local dev server.</p>
      </section>
    </main>
  );
}
