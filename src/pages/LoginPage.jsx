import { ACCESS_DENIED_MESSAGE, useAuth } from "../auth/AuthProvider";

export default function LoginPage() {
  const {
    configured,
    message,
    missingFirebaseConfig,
    signInLoading,
    signInWithGoogle,
    signOutCurrentUser,
  } = useAuth();

  const denied = message === ACCESS_DENIED_MESSAGE;

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-950 md:grid-cols-[minmax(0,1fr)_minmax(380px,520px)]">
      <section className="flex min-h-[34vh] flex-col justify-between bg-teal-950 px-6 py-8 text-white sm:px-10 md:min-h-screen md:px-14 md:py-12">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-200">
            Algebra I
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
            Freshman Algebra Assignments
          </h1>
        </div>
        <p className="mt-10 max-w-xl text-base leading-7 text-teal-50 sm:text-lg">
          Sign in with your school Google account to reach your assigned worksheets and
          dashboard.
        </p>
      </section>

      <section className="grid place-items-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <h2 className="text-2xl font-black">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access is limited to active student, teacher, and admin accounts assigned in
            the school system.
          </p>

          <button
            className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 text-base font-black text-slate-950 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={!configured || signInLoading}
            onClick={signInWithGoogle}
            type="button"
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-sm font-black text-teal-800"
              aria-hidden="true"
            >
              G
            </span>
            {signInLoading ? "Signing in..." : "Sign in with Google"}
          </button>

          <div
            className={`mt-5 min-h-20 rounded-lg border px-4 py-3 text-sm leading-6 ${
              message
                ? "border-rose-200 bg-rose-50 text-rose-950"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
            aria-live="polite"
          >
            {message || "Your assigned account will be checked before any dashboard loads."}
            {!configured && missingFirebaseConfig.length ? (
              <p className="mt-2 font-semibold">
                Missing Firebase config: {missingFirebaseConfig.join(", ")}.
              </p>
            ) : null}
          </div>

          {denied ? (
            <button
              className="mt-4 min-h-11 w-full rounded-lg bg-slate-900 px-4 font-bold text-white transition hover:bg-slate-700"
              onClick={signOutCurrentUser}
              type="button"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
