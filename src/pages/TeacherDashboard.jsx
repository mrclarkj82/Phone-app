import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { demoStudent, roster } from "../../app";
import { useAuth } from "../auth/AuthProvider";
import AnnouncementDisplay from "../components/AnnouncementDisplay";
import PrivateHeader from "../components/PrivateHeader";
import useAssignmentDashboard from "../hooks/useAssignmentDashboard";
import { appCollection } from "../lib/appFirestore";
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
        ? appCollection("classes")
        : query(appCollection("classes"), where("teacherUid", "==", account.uid));

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

    if (account.role === "admin") {
      assignedKeys.push(demoStudent.key);
    }

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
        <Link
          className="grid min-h-11 place-items-center rounded-md bg-white px-4 text-sm font-black text-teal-900 transition hover:bg-teal-50"
          to="/assignments/create"
        >
          Create Assignment
        </Link>
        <Link
          className="grid min-h-11 place-items-center rounded-md border border-white/30 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/20"
          to="/corrections?studentKey=example-avery&assignmentId=unit-1-parts-of-an-expression-v1&mode=teacher"
        >
          Correction Monitor
        </Link>
      </PrivateHeader>

      <main className="app-shell">
        <div hidden id="custom-assignment-list" />
        {classError ? (
          <section className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {classError}
          </section>
        ) : null}
        <AnnouncementDisplay audienceRole="teacher" className="mb-5" />
        {classes.length ? (
          <section aria-labelledby="class-codes-heading" className="mb-5 border-y border-slate-200 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Class Codes</p>
                <h2 className="m-0 text-xl font-black" id="class-codes-heading">
                  Share With Students
                </h2>
              </div>
              <div className="grid w-full gap-2 sm:w-auto sm:min-w-80">
                {[...classes]
                  .sort((left, right) =>
                    String(left.name || left.id).localeCompare(String(right.name || right.id)),
                  )
                  .map((classRecord) => (
                    <div
                      className="flex min-h-14 items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-2"
                      key={classRecord.id}
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-slate-800">
                          {classRecord.name || classRecord.id}
                        </p>
                        {classRecord.period ? (
                          <p className="m-0 text-xs font-semibold text-slate-500">
                            Period {classRecord.period}
                          </p>
                        ) : null}
                      </div>
                      <strong className="shrink-0 text-base text-teal-800">{classRecord.id}</strong>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        ) : null}
        <section aria-labelledby="teacher-heading">
          <div className="dashboard-grid">
            <section className="dashboard-summary" aria-label="Class summary">
              <div>
                <p className="eyebrow">Teacher</p>
                <h2 id="teacher-heading">Class Dashboard</h2>
              </div>
              <div className="dashboard-controls">
                <label htmlFor="dashboard-unit-select">Unit</label>
                <select id="dashboard-unit-select" />

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
                      <th scope="col">Corrections</th>
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
