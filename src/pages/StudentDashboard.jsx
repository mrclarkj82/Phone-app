import PrivateHeader from "../components/PrivateHeader";
import useAssignmentDashboard from "../hooks/useAssignmentDashboard";

export default function StudentDashboard() {
  useAssignmentDashboard();

  return (
    <>
      <PrivateHeader eyebrow="Algebra I" title="Student Assignment">
        <div className="header-stats" aria-label="Assignment summary">
          <span>
            <strong id="header-problem-count">30</strong> problems
          </span>
          <span>
            <strong id="header-student-count">24</strong> students
          </span>
        </div>
      </PrivateHeader>

      <main className="app-shell">
        <section aria-labelledby="student-heading">
          <div className="workspace-grid">
            <aside className="student-panel" aria-label="Student information">
              <h2 id="student-heading">Student</h2>
              <label htmlFor="assignment-select">Assignment</label>
              <select id="assignment-select" />

              <label htmlFor="student-id">Student ID</label>
              <input
                id="student-id"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="9"
                autoComplete="off"
                aria-describedby="student-access-note"
              />
              <p className="access-note" id="student-access-note" aria-live="polite" />

              <button className="primary-button" id="load-assignment" type="button">
                Access Worksheets
              </button>

              <div className="score-box" aria-live="polite">
                <span>Grade</span>
                <strong id="current-score">0 / 30</strong>
                <small id="current-percent">--</small>
              </div>

              <button className="submit-button" id="submit-assignment" type="button" disabled>
                Submit Grade
              </button>
              <p className="submission-note" id="submission-note" />
            </aside>

            <section className="assignment-panel" aria-label="Linear equation problems">
              <div className="assignment-toolbar">
                <div>
                  <p className="eyebrow" id="assignment-directions">
                    Solve for x
                  </p>
                  <h2 id="assignment-title">Enter your student ID to begin</h2>
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
