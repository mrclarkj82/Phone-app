import PrivateHeader from "../components/PrivateHeader";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <PrivateHeader eyebrow="Algebra I" title="Admin Dashboard" />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 sm:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-teal-700">
            Admin
          </p>
          <h2 className="mt-3 text-2xl font-black">Account access is protected</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Admin-only tools can be added here. This route stays restricted to active assigned
            admin accounts.
          </p>
        </div>
      </section>
    </main>
  );
}
