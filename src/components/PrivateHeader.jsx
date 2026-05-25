import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function PrivateHeader({ title, eyebrow, children }) {
  const { account, signOutCurrentUser } = useAuth();
  const navLinks =
    account?.role === "admin"
      ? [
          { label: "Admin", to: "/admin" },
          { label: "Teacher", to: "/teacher" },
          { label: "Create", to: "/assignments/create" },
        ]
      : account?.role === "teacher"
        ? [
            { label: "Teacher", to: "/teacher" },
            { label: "Create", to: "/assignments/create" },
          ]
        : [
          {
            label: "Student",
            to: "/student",
          },
        ];

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {children}
        <nav className="flex flex-wrap justify-end gap-2" aria-label="Private pages">
          {navLinks.map((link) => (
            <Link
              className="grid min-h-10 place-items-center rounded-md border border-white/20 bg-white/10 px-3 text-sm font-black text-white transition hover:bg-white/20"
              key={link.to}
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="grid gap-0.5 text-right text-sm text-slate-100">
          <strong className="font-black">Signed in</strong>
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
