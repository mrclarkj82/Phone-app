import { useAuth } from "../auth/AuthProvider";

export default function PrivateHeader({ title, eyebrow, children }) {
  const { account, signOutCurrentUser } = useAuth();

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {children}
        <div className="grid gap-0.5 text-right text-sm text-slate-100">
          <strong className="font-black">{account?.displayName || account?.email}</strong>
          <span className="capitalize text-teal-100">{account?.role}</span>
        </div>
        <button
          className="min-h-11 rounded-md border border-white/25 bg-white/10 px-4 font-black text-white transition hover:bg-white/20"
          onClick={signOutCurrentUser}
          type="button"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
