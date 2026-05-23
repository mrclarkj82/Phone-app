export default function LoadingScreen({ label = "Loading" }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-950">
      <div className="grid justify-items-center gap-4 text-center">
        <span
          className="h-11 w-11 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700"
          aria-hidden="true"
        />
        <p className="text-base font-semibold">{label}</p>
      </div>
    </main>
  );
}
