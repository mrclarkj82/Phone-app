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

  useAssignmentDashboard({ enabled: classesLoaded && !classError, visibleStudentKeys });

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
