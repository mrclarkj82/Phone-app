import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import PrivateHeader from "../components/PrivateHeader";
import useAssignmentDashboard from "../hooks/useAssignmentDashboard";
import { db } from "../lib/firebase";
import LoadingScreen from "./LoadingScreen";

export default function AssignmentMaker() {
  const { account } = useAuth();
  const [accountClasses, setAccountClasses] = useState([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [classError, setClassError] = useState("");

  useEffect(() => {
    if (!account) return undefined;

    setClassesLoaded(false);
    setClassError("");

    const classSource =
      account.role === "admin"
        ? collection(db, "classes")
        : query(collection(db, "classes"), where("teacherUid", "==", account.uid));

    const unsubscribe = onSnapshot(
      classSource,
      (snapshot) => {
        setAccountClasses(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setClassesLoaded(true);
        setClassError("");
      },
      (error) => {
        setClassError(error.message || "Unable to load classes.");
        setClassesLoaded(true);
      },
    );

    return unsubscribe;
  }, [account]);

  return (
    <AssignmentMakerContent
      account={account}
      accountClasses={accountClasses}
      classError={classError}
      classesLoaded={classesLoaded}
    />
  );
}

function AssignmentMakerContent({ account, accountClasses, classError, classesLoaded }) {
  const classOptions = useMemo(
    () =>
      accountClasses
        .map((classRecord) => ({
          id: classRecord.id,
          label: classRecord.name || classRecord.title || classRecord.id,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [accountClasses],
  );

  useAssignmentDashboard({ account, enabled: classesLoaded });

  if (!classesLoaded) {
    return <LoadingScreen label="Loading assignment maker" />;
  }

  return (
    <>
      <PrivateHeader eyebrow="Algebra I" title="Assignment Maker">
        <Link
          className="grid min-h-11 place-items-center rounded-md bg-white px-4 text-sm font-black text-teal-900 transition hover:bg-teal-50"
          to="/teacher"
        >
          Back to Dashboard
        </Link>
      </PrivateHeader>

      <main className="app-shell">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm font-extrabold text-slate-500">
          <Link className="text-teal-800 hover:text-teal-950" to="/teacher">
            Teacher Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-700">Create Assignment</span>
        </nav>

        {classError ? (
          <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {classError}
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section
            aria-labelledby="assignment-builder-heading"
            className="assignment-builder"
            id="assignment-builder"
          >
            <div className="builder-heading">
              <div>
                <p className="eyebrow">Assignment Builder</p>
                <h2 id="assignment-builder-heading">Create Assignment</h2>
              </div>
              <button className="primary-button" id="save-assignment" type="button">
                Create Assignment
              </button>
            </div>

            <div className="grid gap-4">
              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="eyebrow">Details</p>
                </div>
                <div className="builder-grid">
                  <label>
                    <span>Assignment title</span>
                    <input
                      id="custom-assignment-title"
                      placeholder="Unit 4 Slope Practice"
                      type="text"
                    />
                  </label>
                  <label>
                    <span>Assignment type</span>
                    <select id="custom-assignment-type" />
                  </label>
                  <label>
                    <span>Problems</span>
                    <select defaultValue="10" id="custom-problem-count">
                      <option value="5">5 problems</option>
                      <option value="10">10 problems</option>
                      <option value="15">15 problems</option>
                      <option value="20">20 problems</option>
                      <option value="custom">Custom amount</option>
                    </select>
                  </label>
                  <label>
                    <span>Custom amount</span>
                    <input
                      hidden
                      id="custom-problem-count-other"
                      max="60"
                      min="1"
                      type="number"
                      defaultValue="12"
                    />
                  </label>
                  <label>
                    <span>Difficulty</span>
                    <select defaultValue="mixed" id="custom-difficulty">
                      <option value="easy">Easy</option>
                      <option value="mixed">Mixed</option>
                      <option value="challenge">Challenge</option>
                    </select>
                  </label>
                  <label>
                    <span>Due date</span>
                    <input id="custom-due-date" type="date" />
                  </label>
                  <label>
                    <span>Class</span>
                    <select defaultValue="" id="custom-class-period">
                      <option value="">Default class</option>
                      {classOptions.map((classRecord) => (
                        <option key={classRecord.id} value={classRecord.label}>
                          {classRecord.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="eyebrow">Settings</p>
                </div>
                <div className="builder-grid">
                  <label>
                    <span>Feedback</span>
                    <select defaultValue="after-submit" id="custom-feedback-mode">
                      <option value="after-submit">Only after submission</option>
                      <option value="immediate">Show immediately</option>
                    </select>
                  </label>
                  <label className="check-field">
                    <input id="custom-allow-retries" type="checkbox" />
                    <span>Allow retries</span>
                  </label>
                  <label>
                    <span>Maximum attempts</span>
                    <input
                      defaultValue="1"
                      id="custom-max-attempts"
                      max="10"
                      min="1"
                      type="number"
                    />
                  </label>
                  <label className="check-field">
                    <input id="custom-time-enabled" type="checkbox" />
                    <span>Enable time limit</span>
                  </label>
                  <label>
                    <span>Time limit minutes</span>
                    <input
                      defaultValue="30"
                      disabled
                      id="custom-time-limit"
                      max="180"
                      min="1"
                      type="number"
                    />
                  </label>
                </div>
              </section>
            </div>

            <p className="dashboard-sync-status" id="teacher-note" aria-live="polite" />
            <div className="custom-assignment-list" id="custom-assignment-list" />
          </section>

          <section className="grid gap-4 self-start">
            <section
              className="assignment-preview"
              id="assignment-preview"
              aria-label="Assignment preview"
            />
          </section>
        </section>
      </main>
    </>
  );
}
