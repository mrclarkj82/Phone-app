import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { roster } from "../../app";
import { useAuth } from "../auth/AuthProvider";
import PrivateHeader from "../components/PrivateHeader";
import useAssignmentDashboard from "../hooks/useAssignmentDashboard";
import { db } from "../lib/firebase";
import LoadingScreen from "./LoadingScreen";

export default function TeacherDashboard() {
  const { account } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [classError, setClassError] = useState("");

  useEffect(() => {
    if (!account) return undefined;

    const classSource =
      account.role === "admin"
        ? collection(db, "classes")
        : query(collection(db, "classes"), where("teacherUid", "==", account.uid));

    const unsubscribe = onSnapshot(
      classSource,
      (snapshot) => {
        setClasses(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setClassesLoaded(true);
        setClassError("");
      },
      (error) => {
        setClassError(error.message || "Unable to load assigned classes.");
        setClassesLoaded(true);
      },
    );

    return unsubscribe;
  }, [account]);

  const visibleStudentKeys = useMemo(() => {
    if (!classesLoaded || !account) return null;

    const matchingClasses = classes.filter(
      (classRecord) =>
        classRecord.teacherUid === account.uid ||
        String(classRecord.teacherEmail || "").toLowerCase() ===
          String(account.email || "").toLowerCase(),
    );

    const assignedKeys = matchingClasses.flatMap((classRecord) =>
      Array.isArray(classRecord.studentKeys)
        ? classRecord.studentKeys
        : Array.isArray(classRecord.studentUids)
          ? classRecord.studentUids
          : [],
    );

    return [...new Set(assignedKeys)].filter((key) =>
      roster.some((student) => student.key === key),
    );
  }, [account, classes, classesLoaded]);

  useAssignmentDashboard({ account, enabled: classesLoaded && !classError, visibleStudentKeys });

  if (!classesLoaded) {
    return <LoadingScreen label="Loading assigned roster" />;
  }

  return (
    <>
      <PrivateHeader eyebrow="Algebra I" title="Teacher Dashboard">
        <div className="header-stats" aria-label="Assignment summary">
          <span>
            <strong id="header-problem-count">30</strong> problems
          </span>
          <span>
            <strong id="header-student-count">{visibleStudentKeys?.length || 0}</strong> students
          </span>
        </div>
      </PrivateHeader>

      <main className="app-shell">
        {classError ? (
          <section className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {classError}
          </section>
        ) : null}
        <section className="teacher-tool-section" aria-labelledby="assignment-builder-heading">
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
                <span>Class / period</span>
                <input id="custom-class-period" placeholder="Period 1" type="text" />
              </label>
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
                <input defaultValue="1" id="custom-max-attempts" max="10" min="1" type="number" />
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
            <p className="dashboard-sync-status" id="teacher-note" aria-live="polite" />
            <section className="assignment-preview" id="assignment-preview" aria-label="Assignment preview" />
            <div className="custom-assignment-list" id="custom-assignment-list" />
          </section>
        </section>

        <section aria-labelledby="teacher-heading">
          <div className="dashboard-grid">
            <section className="dashboard-summary" aria-label="Class summary">
              <div>
                <p className="eyebrow">Teacher</p>
                <h2 id="teacher-heading">Class Dashboard</h2>
              </div>
              <div className="dashboard-controls">
                <label htmlFor="dashboard-assignment-select">Assignment</label>
                <select id="dashboard-assignment-select" />
              </div>
              <div className="summary-metrics">
                <div>
                  <span>Submitted</span>
                  <strong id="submitted-count">0 / 24</strong>
                </div>
                <div>
                  <span>Class Average</span>
                  <strong id="class-average">--</strong>
                </div>
                <div>
                  <span>Highest</span>
                  <strong id="highest-score">--</strong>
                </div>
              </div>
              <p className="dashboard-sync-status" id="dashboard-sync-status" aria-live="polite" />
            </section>

            <section
              aria-label="Student work review"
              className="student-work-panel"
              id="student-work-panel"
              tabIndex="-1"
            >
              <div className="student-work-header">
                <div>
                  <p className="eyebrow">Student Work</p>
                  <h3 id="student-work-title">Choose a student</h3>
                  <p id="student-work-meta">
                    Use View Work in the roster to inspect generated problems, submitted answers,
                    and the answer key.
                  </p>
                </div>
                <button
                  className="secondary-button table-reset-button"
                  hidden
                  id="close-work-panel"
                  type="button"
                >
                  Close
                </button>
              </div>
              <div className="student-work-problems" id="student-work-problems">
                <div className="empty-state compact-empty">No student selected.</div>
              </div>
            </section>

            <section className="dashboard-table-wrap" aria-label="Submitted grades">
              <div className="table-actions">
                <h3>Roster</h3>
                <div className="table-buttons">
                  <button className="secondary-button" id="refresh-dashboard" type="button">
                    Refresh
                  </button>
                  <button className="secondary-button" id="reset-dashboard" type="button">
                    Clear All Submissions
                  </button>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Status</th>
                      <th scope="col">Score</th>
                      <th scope="col">Grade</th>
                      <th scope="col">Answered</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Work</th>
                      <th scope="col">Reset</th>
                    </tr>
                  </thead>
                  <tbody id="dashboard-body" />
                </table>
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
