import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import AnnouncementDisplay from "../components/AnnouncementDisplay";
import PrivateHeader from "../components/PrivateHeader";
import useAssignmentDashboard from "../hooks/useAssignmentDashboard";
import useStudentClass from "../hooks/useStudentClass";
import { joinStudentClass, normalizeClassCode } from "../lib/classAccess";
import LoadingScreen from "./LoadingScreen";

export default function StudentDashboard() {
  const { account } = useAuth();
  const [classRefreshKey, setClassRefreshKey] = useState(0);
  const { studentClass, classLoaded, classError } = useStudentClass(account, classRefreshKey);
  const [classCode, setClassCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  const student = studentClass
    ? {
        key: account.uid,
        name: account.displayName || account.email || "Student",
      }
    : null;

  useAssignmentDashboard({
    account,
    activeClassId: studentClass?.id || "",
    enabled: Boolean(studentClass),
    student,
  });

  async function submitClassCode(event) {
    event.preventDefault();
    setJoinError("");
    setJoining(true);

    try {
      await joinStudentClass(account, classCode);
      setClassRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setJoinError(error.message || "Unable to join that class.");
    } finally {
      setJoining(false);
    }
  }

  if (!classLoaded) {
    return <LoadingScreen label="Checking class enrollment" />;
  }

  if (!studentClass) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10 text-slate-950">
        <form
          className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8"
          onSubmit={submitClassCode}
        >
          <p className="eyebrow">Student Access</p>
          <h1 className="m-0 mt-2 text-3xl font-black">Enter your class code</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ask your Algebra I teacher for the 6-character code shown on their Teacher
            Dashboard.
          </p>

          <label className="mt-6 grid gap-2 font-bold" htmlFor="class-code">
            Class code
            <input
              autoComplete="off"
              autoFocus
              className="min-h-14 text-center text-2xl font-black uppercase tracking-[0.25em]"
              id="class-code"
              maxLength="6"
              onChange={(event) => {
                setClassCode(normalizeClassCode(event.target.value));
                setJoinError("");
              }}
              placeholder="ABC234"
              value={classCode}
            />
          </label>

          <button
            className="primary-button mt-4 w-full px-5"
            disabled={joining || classCode.length !== 6}
            type="submit"
          >
            {joining ? "Joining class..." : "Join Class"}
          </button>

          <p
            className={`mt-4 min-h-12 rounded-md border px-4 py-3 text-sm font-semibold ${
              joinError || classError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
            aria-live="polite"
          >
            {joinError || classError || `Signed in as ${account.email}`}
          </p>
        </form>
      </main>
    );
  }

  return (
    <>
      <PrivateHeader eyebrow="Algebra I" title="Student Assignment">
        <div className="header-stats" aria-label="Class summary">
          <span>
            <strong>{studentClass.classCode}</strong> class
          </span>
          <span>
            <strong id="header-problem-count">30</strong> problems
          </span>
        </div>
      </PrivateHeader>

      <main className="app-shell">
        <AnnouncementDisplay audienceRole="student" className="mb-5" />
        <section aria-labelledby="student-heading">
          <div className="workspace-grid">
            <aside className="student-panel" aria-label="Student information">
              <p className="eyebrow">{studentClass.name || "Algebra I Class"}</p>
              <h2 id="student-heading">{account.displayName || "Student"}</h2>

              <label htmlFor="unit-select">Unit</label>
              <select id="unit-select" />

              <label htmlFor="assignment-select">Assignment</label>
              <select id="assignment-select" />

              <div className="score-box" aria-live="polite">
                <span>Grade</span>
                <strong id="current-score">0 / 30</strong>
                <small id="current-percent">--</small>
              </div>

              <button className="submit-button" id="submit-assignment" type="button" disabled>
                Submit Grade
              </button>
              <p className="submission-note" id="submission-note" />
              <a
                className="primary-button mt-3 grid min-h-11 place-items-center px-4 text-center no-underline"
                hidden
                id="correction-review-link"
              >
                Review Corrections
              </a>
            </aside>

            <section className="assignment-panel" aria-label="Assignment problems">
              <div className="assignment-toolbar">
                <div>
                  <p className="eyebrow" id="assignment-directions">
                    Solve for x
                  </p>
                  <h2 id="assignment-title">Loading your assignment</h2>
                </div>
                <div className="mini-metrics">
                  <span id="answered-count">0 answered</span>
                  <span id="correct-count">Grade hidden</span>
                </div>
              </div>
              <div className="problem-list" id="problem-list" />
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
